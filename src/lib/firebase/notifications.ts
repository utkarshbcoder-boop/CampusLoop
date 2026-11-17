/**
 * Notification inbox (feature 4).
 *
 * Fire-and-forget friendly: `createNotification` never rejects — a failed
 * notification must never break the action that triggered it (an interest
 * registration, a sent message, a review). Reads are scoped by rules to the
 * recipient; queries use a single equality filter with client-side sorting
 * to avoid composite indexes.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./config";

export type NotificationType = "interest" | "message" | "review";

export interface AppNotification {
  id: string;
  profile_id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** The conversation / listing the notification points at. */
  target_id: string;
  read: boolean;
  created_at: string;
}

export interface CreateNotificationInput {
  /** Recipient — must never be the sender (rules enforce this). */
  profileId: string;
  type: NotificationType;
  title: string;
  body: string;
  targetId: string;
}

/**
 * Create a notification for another user. Returns true on success.
 * Never throws: notifications are a secondary effect of the caller's action.
 */
export async function createNotification(input: CreateNotificationInput): Promise<boolean> {
  try {
    const reference = doc(collection(db, "notifications"));
    await setDoc(reference, {
      profile_id: input.profileId,
      type: input.type,
      title: input.title.slice(0, 120),
      body: input.body.slice(0, 300),
      target_id: input.targetId,
      read: false,
      created_at: new Date().toISOString(),
    });
    return true;
  } catch (cause) {
    console.error("createNotification failed:", cause);
    return false;
  }
}

/** Live subscription to the signed-in user's notifications (newest first, capped at 50). */
export function watchMyNotifications(
  uid: string,
  onData: (items: AppNotification[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const q = query(collection(db, "notifications"), where("profile_id", "==", uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as AppNotification))
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .slice(0, 50);
      onData(items);
    },
    (error) => {
      console.error("watchMyNotifications failed:", error);
      onError?.(error);
    },
  );
}

export async function getNotification(id: string): Promise<AppNotification | null> {
  try {
    const snapshot = await getDoc(doc(db, "notifications", id));
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as AppNotification) : null;
  } catch (cause) {
    console.error("getNotification failed:", cause);
    return null;
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  await updateDoc(doc(db, "notifications", id), { read: true });
}

/** Mark every provided unread notification as read (each is its own rules-legal update). */
export async function markAllNotificationsRead(items: AppNotification[]): Promise<void> {
  const unread = items.filter((item) => !item.read);
  await Promise.allSettled(unread.map((item) => markNotificationRead(item.id)));
}

/** Best-effort delete of one of the user's own notifications. */
export async function deleteNotification(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "notifications", id));
    return true;
  } catch (cause) {
    console.error("deleteNotification failed:", cause);
    return false;
  }
}
