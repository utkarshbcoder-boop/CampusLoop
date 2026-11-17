/**
 * Account-synced wishlist (feature 6).
 *
 * Contract (must match firestore.rules):
 *  - Doc ID `${uid}__${itemId}` — one save per user per item, no duplicates.
 *  - The document carries only user_id / item_id / created_at (no `id` field).
 *  - Reads are scoped to the owner; there is no update op (re-save = no-op).
 *
 * `item_id` reuses the store's save keys as-is: plain listing ids for items
 * and `home:<id>` for homes, so localStorage → Firestore migration is a
 * straight 1:1 copy.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "./config";

function saveRef(userId: string, itemId: string) {
  return doc(db, "user_saves", `${userId}__${itemId}`);
}

/** Every save id for a user (same keys the local store uses). */
export async function fetchMySaves(userId: string): Promise<string[]> {
  try {
    const snapshot = await getDocs(query(collection(db, "user_saves"), where("user_id", "==", userId)));
    return snapshot.docs.map((d) => String(d.data().item_id ?? "")).filter(Boolean);
  } catch (cause) {
    console.error("fetchMySaves failed:", cause);
    return [];
  }
}

/** Live subscription to a user's saves. */
export function watchMySaves(
  userId: string,
  onData: (itemIds: string[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const q = query(collection(db, "user_saves"), where("user_id", "==", userId));
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((d) => String(d.data().item_id ?? "")).filter(Boolean)),
    (error) => {
      console.error("watchMySaves failed:", error);
      onError?.(error);
    },
  );
}

/** Idempotent — returns true when a new save was written. */
export async function addSave(userId: string, itemId: string): Promise<boolean> {
  const reference = saveRef(userId, itemId);
  const existing = await getDoc(reference);
  if (existing.exists()) return false;
  await setDoc(reference, {
    user_id: userId,
    item_id: itemId,
    created_at: new Date().toISOString(),
  });
  return true;
}

/** Idempotent — returns true when a save was removed. */
export async function removeSave(userId: string, itemId: string): Promise<boolean> {
  const reference = saveRef(userId, itemId);
  const existing = await getDoc(reference);
  if (!existing.exists()) return false;
  await deleteDoc(reference);
  return true;
}

/**
 * Bulk save — used by the localStorage → Firestore migration on first sign-in.
 * Skips items that already exist; never rejects the whole batch.
 */
export async function addSaves(userId: string, itemIds: string[]): Promise<void> {
  const results = await Promise.allSettled(itemIds.map((itemId) => addSave(userId, itemId)));
  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    console.error(`addSaves: ${failures.length}/${itemIds.length} saves failed`);
  }
}
