/**
 * Firestore-backed DataProvider.
 *
 * Implements the same `DataProvider` interface as the mock and Supabase
 * providers, so the rest of the app works unchanged. All writes are
 * immediately visible to every connected client via Firestore's real-time
 * sync.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  startAfter,
  limit as fbLimit,
  type QueryConstraint,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./config";
import type { DataProvider, ListOptions, WritableTable } from "@/lib/db/provider";
import type {
  CampusEvent,
  CampusService,
  College,
  CollegeSubscription,
  Equipment,
  Listing,
  Notification,
  Opportunity,
  PGListing,
  Profile,
  ServiceBooking,
  SkillProfile,
  Sponsorship,
  TeammatePost,
  Transaction,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Generic Firestore table                                             */
/* ------------------------------------------------------------------ */

function makeId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Array fields that documents written via the admin free-form JSON editor may omit. */
const ARRAY_DEFAULTS = ["tags", "highlights", "image_urls", "specs"] as const;
/** String fields that documents written via the admin free-form JSON editor may omit. */
const STRING_DEFAULTS = ["author", "edition", "subject"] as const;

/**
 * Map a raw Firestore document onto the app's row shape, filling safe
 * defaults for fields the admin JSON editor may have left out so callers can
 * spread `listing.tags` / `listing.highlights` without crashing.
 */
function mapDoc<T extends { id: string }>(data: DocumentData, id: string): T {
  const row = { id, ...data } as Record<string, unknown>;
  for (const field of ARRAY_DEFAULTS) {
    if (!Array.isArray(row[field])) row[field] = [];
  }
  for (const field of STRING_DEFAULTS) {
    row[field] = row[field] ?? "";
  }
  return row as unknown as T;
}

function firestoreTable<T extends { id: string }>(collectionName: string): WritableTable<T> {
  const colRef = () => collection(db, collectionName);

  async function listUncached(options?: ListOptions): Promise<T[]> {
      const constraints: QueryConstraint[] = [];

      // Equality filters
      if (options?.where) {
        for (const [key, val] of Object.entries(options.where)) {
          if (val !== undefined && val !== null) {
            constraints.push(where(key, "==", val));
          }
        }
      }

      // IN filters
      if (options?.whereIn) {
        for (const [key, vals] of Object.entries(options.whereIn)) {
          if (vals.length > 0) {
            // Firestore 'in' supports max 30 values
            constraints.push(where(key, "in", vals.slice(0, 30)));
          }
        }
      }

      // GTE filters
      if (options?.gte) {
        for (const [key, val] of Object.entries(options.gte)) {
          constraints.push(where(key, ">=", val));
        }
      }

      // LTE filters
      if (options?.lte) {
        for (const [key, val] of Object.entries(options.lte)) {
          constraints.push(where(key, "<=", val));
        }
      }

      // Order
      if (options?.orderBy) {
        constraints.push(
          orderBy(options.orderBy.column, options.orderBy.ascending ? "asc" : "desc"),
        );
      }

      if (options?.startAfterId) {
        const cursor = await getDoc(doc(db, collectionName, options.startAfterId));
        if (cursor.exists()) {
          constraints.push(startAfter(cursor));
        }
        // A deleted cursor (e.g. a bookmarked ?after=<id> for a removed doc)
        // falls back to the first page instead of erroring the whole route.
      }

      // Limit
      if (options?.limit) {
        constraints.push(fbLimit(options.limit));
      }

      let q;
      try {
        q = query(colRef(), ...constraints);
      } catch (cause) {
        if (options?.limit !== undefined || options?.startAfterId) {
          throw new Error(`[CampusLoop/Firestore] Could not build paginated query for ${collectionName}.`, { cause });
        }
        // Firestore composite index may not exist yet — fall back to
        // fetching everything and filtering in memory.
        q = query(colRef());
      }

      let snapshot;
      let usedFallback = false;
      try {
        snapshot = await getDocs(q);
      } catch (cause) {
        if (options?.limit !== undefined || options?.startAfterId) {
          throw new Error(`[CampusLoop/Firestore] Paginated query failed for ${collectionName}.`, { cause });
        }
        // Missing composite index etc. — fetch the whole collection and
        // apply every filter/sort client-side below.
        snapshot = await getDocs(query(colRef()));
        usedFallback = true;
      }

      let results = snapshot.docs.map((d) => mapDoc<T>(d.data(), d.id));

      if (usedFallback) {
        if (options?.where) {
          for (const [key, val] of Object.entries(options.where)) {
            if (val !== undefined && val !== null) {
              results = results.filter(
                (row) => (row as Record<string, unknown>)[key] === val,
              );
            }
          }
        }
        if (options?.whereIn) {
          for (const [key, vals] of Object.entries(options.whereIn)) {
            if (vals.length > 0) {
              results = results.filter((row) =>
                vals.includes((row as Record<string, unknown>)[key] as string),
              );
            }
          }
        }
        if (options?.gte) {
          for (const [key, val] of Object.entries(options.gte)) {
            results = results.filter(
              (row) => ((row as Record<string, unknown>)[key] as number) >= val,
            );
          }
        }
        if (options?.lte) {
          for (const [key, val] of Object.entries(options.lte)) {
            results = results.filter(
              (row) => ((row as Record<string, unknown>)[key] as number) <= val,
            );
          }
        }
      }

      // Client-side search fallback
      if (options?.search) {
        const term = options.search.term.toLowerCase();
        const col = options.search.column;
        results = results.filter((row) => {
          const val = (row as Record<string, unknown>)[col];
          if (typeof val === "string") return val.toLowerCase().includes(term);
          if (Array.isArray(val)) return val.some((v) => String(v).toLowerCase().includes(term));
          return false;
        });
      }

      // Client-side sort fallback for when Firestore constraints fail
      if (options?.orderBy && results.length > 0) {
        const { column, ascending } = options.orderBy;
        results.sort((a, b) => {
          const aVal = (a as Record<string, unknown>)[column];
          const bVal = (b as Record<string, unknown>)[column];
          if (aVal === bVal) return 0;
          if (aVal == null) return 1;
          if (bVal == null) return -1;
          const cmp = aVal < bVal ? -1 : 1;
          return ascending ? cmp : -cmp;
        });
      }

      if (usedFallback && options?.startAfterId) {
        const cursorIndex = results.findIndex((row) => row.id === options.startAfterId);
        if (cursorIndex >= 0) results = results.slice(cursorIndex + 1);
      }

      // Client-side offset
      if (options?.offset) {
        results = results.slice(options.offset);
      }
      if (options?.limit !== undefined) results = results.slice(0, options.limit);

      return results;
  }

  return {
    list(options?: ListOptions): Promise<T[]> {
      return listUncached(options);
    },

    async byId(id: string): Promise<T | null> {
      const snap = await getDoc(doc(db, collectionName, id));
      if (!snap.exists()) return null;
      return mapDoc<T>(snap.data(), snap.id);
    },

    async count(options?: ListOptions): Promise<number> {
      const rows = await listUncached(options);
      return rows.length;
    },

    async insert(row: Omit<T, "id"> & Partial<Pick<T, "id">>): Promise<T> {
      const id = (row as { id?: string }).id || makeId();
      const data = { ...row, id } as DocumentData;
      await setDoc(doc(db, collectionName, id), data);
      return data as T;
    },

    async update(id: string, patch: Partial<T>): Promise<T | null> {
      const ref = doc(db, collectionName, id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      await updateDoc(ref, patch as DocumentData);
      return mapDoc<T>({ ...snap.data(), ...patch }, id);
    },

    async remove(id: string): Promise<boolean> {
      const ref = doc(db, collectionName, id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return false;
      await deleteDoc(ref);
      return true;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Provider singleton                                                  */
/* ------------------------------------------------------------------ */

let _provider: DataProvider | null = null;

export function getFirestoreProvider(): DataProvider {
  if (_provider) return _provider;

  _provider = {
    kind: "firebase" as const,
    label: "Firebase Firestore",
    isMock: false,

    colleges: firestoreTable<College>("colleges"),
    profiles: firestoreTable<Profile>("profiles"),
    listings: firestoreTable<Listing>("listings"),
    equipment: firestoreTable<Equipment>("equipment"),
    pg_listings: firestoreTable<PGListing>("pg_listings"),
    teammate_posts: firestoreTable<TeammatePost>("teammate_posts"),
    skill_profiles: firestoreTable<SkillProfile>("skill_profiles"),
    events: firestoreTable<CampusEvent>("events"),
    services: firestoreTable<CampusService>("services"),
    bookings: firestoreTable<ServiceBooking>("bookings"),
    opportunities: firestoreTable<Opportunity>("opportunities"),
    transactions: firestoreTable<Transaction>("transactions"),
    subscriptions: firestoreTable<CollegeSubscription>("subscriptions"),
    sponsorships: firestoreTable<Sponsorship>("sponsorships"),
    notifications: firestoreTable<Notification>("notifications"),
  };

  return _provider;
}
