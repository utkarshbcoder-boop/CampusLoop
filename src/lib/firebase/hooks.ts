/**
 * Real-time Firestore hooks.
 *
 * These hooks subscribe to Firestore collections via `onSnapshot`, so every
 * connected user sees admin edits within ~1 second, with no page refresh.
 */

"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  type QueryConstraint,
  doc,
} from "firebase/firestore";
import { db } from "./config";

/** Subscribe to a full Firestore collection. Returns live data + loading state. */
export function useCollection<T extends { id: string }>(
  collectionName: string,
  constraints?: {
    orderByField?: string;
    orderDirection?: "asc" | "desc";
    whereField?: string;
    whereValue?: unknown;
  },
): { data: T[]; loading: boolean; error: string | null } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const qConstraints: QueryConstraint[] = [];

    if (constraints?.whereField && constraints?.whereValue !== undefined) {
      qConstraints.push(where(constraints.whereField, "==", constraints.whereValue));
    }

    if (constraints?.orderByField) {
      qConstraints.push(orderBy(constraints.orderByField, constraints.orderDirection ?? "asc"));
    }

    const q = query(collection(db, collectionName), ...qConstraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T));
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Firestore onSnapshot error [${collectionName}]:`, err);
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    collectionName,
    constraints?.orderByField,
    constraints?.orderDirection,
    constraints?.whereField,
    // Serialise the where value so the effect re-runs when it changes
    JSON.stringify(constraints?.whereValue),
  ]);

  return { data, loading, error };
}

/** Subscribe to a single Firestore document. */
export function useDocument<T extends { id: string }>(
  collectionName: string,
  docId: string | null,
): { data: T | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docId) {
      setData(null);
      setLoading(false);
      return;
    }

    const ref = doc(db, collectionName, docId);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setData({ id: snap.id, ...snap.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Firestore doc error [${collectionName}/${docId}]:`, err);
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [collectionName, docId]);

  return { data, loading, error };
}
