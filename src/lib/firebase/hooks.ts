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
  const whereValueKey = JSON.stringify(constraints?.whereValue);

  useEffect(() => {
    // Guard against a stale subscription writing state after the query
    // identity changes (e.g. a different signed-in user).
    let active = true;

    // Reset so the previous query's rows are never shown while the new one
    // loads — otherwise my-listings briefly renders another user's documents.
    setData([]);
    setLoading(true);
    setError(null);

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
        if (!active) return;
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T));
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        if (!active) return;
        console.error(`Firestore onSnapshot error [${collectionName}]:`, err);
        setError(err.message);
        setLoading(false);
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    collectionName,
    constraints?.orderByField,
    constraints?.orderDirection,
    constraints?.whereField,
    // Serialise the where value so the effect re-runs when it changes
    whereValueKey,
  ]);

  return { data, loading, error };
}
