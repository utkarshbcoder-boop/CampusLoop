/**
 * Buyer <-> seller messaging (feature 9).
 *
 * Contract (must match firestore.rules):
 *  - Conversation IDs are deterministic: `${targetType}_${targetId}_${buyerId}`
 *    so one thread per buyer per listing (no duplicates).
 *  - A conversation must exist before any message is written; the create rule
 *    validates it against the parent listing/home (seller match + availability).
 *  - Message creation bumps exactly one recipient unread counter via a batch
 *    that also sets the conversation preview; only those four fields may change.
 *  - Queries use single-field equality filters only (no composite indexes);
 *    sorting happens client-side.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  where,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./config";
import { createNotification } from "./notifications";

export type ConversationTargetType = "listing" | "home";

export interface Conversation {
  id: string;
  target_type: ConversationTargetType;
  target_id: string;
  target_title: string;
  buyer_id: string;
  seller_id: string;
  last_message: string;
  last_at: string;
  buyer_unread: number;
  seller_unread: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  buyer_id: string;
  seller_id: string;
  text: string;
  read: boolean;
  created_at: string;
}

export function conversationIdFor(
  targetType: ConversationTargetType,
  targetId: string,
  buyerId: string,
): string {
  return `${targetType}_${targetId}_${buyerId}`;
}

/**
 * Find or create the buyer's conversation for a listing/home.
 *
 * Returns the conversation id on success. "own" when the user is the seller,
 * "unavailable" when the listing is gone / sold / not open for messages.
 */
export async function getOrCreateConversation(input: {
  targetType: ConversationTargetType;
  targetId: string;
  targetTitle: string;
  buyerId: string;
}): Promise<
  { status: "created" | "exists"; conversationId: string } | { status: "own" | "unavailable" }
> {
  const { targetType, targetId, targetTitle, buyerId } = input;
  const convId = conversationIdFor(targetType, targetId, buyerId);
  const convRef = doc(db, "conversations", convId);
  const parentRef = doc(db, targetType === "listing" ? "listings" : "home_listings", targetId);

  return runTransaction(db, async (transaction): Promise<
    { status: "created" | "exists"; conversationId: string } | { status: "own" | "unavailable" }
  > => {
    const existing = await transaction.get(convRef);
    if (existing.exists()) return { status: "exists", conversationId: convId };

    const parent = await transaction.get(parentRef);
    if (!parent.exists()) return { status: "unavailable" };

    const data = parent.data() as DocumentData;
    const sellerId = String(
      targetType === "listing" ? data.seller_id ?? "" : data.owner_id ?? "",
    );
    if (!sellerId) return { status: "unavailable" };
    if (sellerId === buyerId) return { status: "own" };
    if (targetType === "listing" && data.status !== "available") return { status: "unavailable" };

    const now = new Date().toISOString();
    transaction.set(convRef, {
      target_type: targetType,
      target_id: targetId,
      target_title: String(targetTitle).slice(0, 300),
      buyer_id: buyerId,
      seller_id: sellerId,
      last_message: "",
      last_at: now,
      buyer_unread: 0,
      seller_unread: 0,
      created_at: now,
    } satisfies DocumentData);
    return { status: "created", conversationId: convId };
  });
}

/** Unread conversations for a user (buyer or seller side), newest activity first. */
export function watchMyConversations(
  uid: string,
  onData: (items: Conversation[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const merged = new Map<string, Conversation>();
  let settled = 0;
  let failed = false;

  const emit = () => {
    if (failed) return;
    settled += 1;
    if (settled < 2) return;
    const items = [...merged.values()].sort((a, b) => (a.last_at < b.last_at ? 1 : -1));
    onData(items);
  };

  const subscribe = (field: "buyer_id" | "seller_id") =>
    onSnapshot(
      query(collection(db, "conversations"), where(field, "==", uid)),
      (snapshot) => {
        for (const removed of snapshot.docChanges()) {
          if (removed.type === "removed") merged.delete(removed.doc.id);
        }
        for (const d of snapshot.docs) {
          merged.set(d.id, { id: d.id, ...d.data() } as Conversation);
        }
        emit();
      },
      (error) => {
        console.error("watchMyConversations failed:", error);
        failed = true;
        onError?.(error);
      },
    );

  const unsubBuyer = subscribe("buyer_id");
  const unsubSeller = subscribe("seller_id");
  return () => {
    unsubBuyer();
    unsubSeller();
  };
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const snapshot = await getDoc(doc(db, "conversations", id));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Conversation) : null;
}

/** Live messages in a thread, oldest first. */
export function watchMessages(
  conversationId: string,
  onData: (items: Message[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const q = query(collection(db, "messages"), where("conversation_id", "==", conversationId));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as Message))
        .sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
      onData(items);
    },
    (error) => {
      console.error("watchMessages failed:", error);
      onError?.(error);
    },
  );
}

/**
 * Send a message: creates the message document and updates the conversation
 * preview/unread counters in one batch, then best-effort notifies the recipient.
 */
export async function sendMessage(
  conversation: Conversation,
  senderId: string,
  rawText: string,
): Promise<void> {
  const text = rawText.trim();
  if (!text) return;
  if (senderId !== conversation.buyer_id && senderId !== conversation.seller_id) {
    throw new Error("You are not a participant in this conversation.");
  }

  const now = new Date().toISOString();
  const preview = text.slice(0, 200);
  const recipientId = senderId === conversation.buyer_id ? conversation.seller_id : conversation.buyer_id;
  const recipientCounter = senderId === conversation.buyer_id ? "seller_unread" : "buyer_unread";

  const batch = writeBatch(db);
  batch.set(doc(collection(db, "messages")), {
    conversation_id: conversation.id,
    sender_id: senderId,
    buyer_id: conversation.buyer_id,
    seller_id: conversation.seller_id,
    text: text.slice(0, 2000),
    read: false,
    created_at: now,
  } satisfies DocumentData);
  batch.update(doc(db, "conversations", conversation.id), {
    last_message: preview,
    last_at: now,
    [recipientCounter]: (conversation[recipientCounter] ?? 0) + 1,
  });
  await batch.commit();

  await createNotification({
    profileId: recipientId,
    type: "message",
    title: conversation.target_title.slice(0, 120),
    body: preview,
    targetId: conversation.id,
  });
}

/**
 * Clear the reader's unread counter and mark incoming messages as read.
 * Safe to call on every thread open.
 */
export async function markConversationRead(
  conversation: Conversation,
  uid: string,
): Promise<void> {
  const isBuyer = uid === conversation.buyer_id;
  if (!isBuyer && uid !== conversation.seller_id) return;
  const unread = isBuyer ? conversation.buyer_unread : conversation.seller_unread;
  if (unread <= 0) return;

  const batch = writeBatch(db);
  batch.update(doc(db, "conversations", conversation.id), {
    [isBuyer ? "buyer_unread" : "seller_unread"]: 0,
  });

  try {
    const snapshot = await getDocs(
      query(
        collection(db, "messages"),
        where("conversation_id", "==", conversation.id),
        where("read", "==", false),
      ),
    );
    for (const d of snapshot.docs) {
      if (d.data().sender_id !== uid) batch.update(d.ref, { read: true });
    }
  } catch (cause) {
    // Counter reset is the important part; unread message flags are cosmetic.
    console.error("markConversationRead: message flags update skipped:", cause);
  }

  await batch.commit();
}

/** Total unread conversations across both sides — used by the header badge. */
export function countUnreadConversations(items: Conversation[], uid: string): number {
  return items.filter(
    (c) => (uid === c.buyer_id ? c.buyer_unread : c.seller_unread) > 0,
  ).length;
}
