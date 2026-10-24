import {
  collegeSubscriptions,
  notifications,
  pricingPlans,
  sponsorships,
  transactions,
} from "@/lib/data/business";
import { campusEvents } from "@/lib/data/campusEvents";
import { campusServices, serviceBookings } from "@/lib/data/campusServices";
import { colleges } from "@/lib/data/colleges";
import { equipment } from "@/lib/data/equipment";
import { listings } from "@/lib/data/listings";
import { opportunities } from "@/lib/data/opportunities";
import { pgListings } from "@/lib/data/pgListings";
import { profiles } from "@/lib/data/profiles";
import { skillProfiles } from "@/lib/data/skillProfiles";
import { teammatePosts } from "@/lib/data/teammatePosts";
import type { College, Profile } from "@/lib/types";
import {
  TABLE_NAMES,
  type DataProvider,
  type ListOptions,
  type TableName,
  type WritableTable,
} from "./provider";

/**
 * Zero-config local data provider.
 *
 * Ships the whole product as TypeScript seed data, implementing the exact same
 * interface as the Supabase provider. No database, no keys, no network.
 *
 * Filtering/sorting/search is evaluated by `applyQuery`, which supports the same
 * operators as the PostgREST builder in `supabase.ts` — so behaviour matches.
 */

/* ------------------------------------------------------------------ */
/* Seed store                                                          */
/* ------------------------------------------------------------------ */

type Row = Record<string, unknown>;

const seed: Record<TableName, readonly Row[]> = {
  colleges: colleges as unknown as readonly Row[],
  profiles: profiles as unknown as readonly Row[],
  listings: listings as unknown as readonly Row[],
  equipment: equipment as unknown as readonly Row[],
  pg_listings: pgListings as unknown as readonly Row[],
  teammate_posts: teammatePosts as unknown as readonly Row[],
  skill_profiles: skillProfiles as unknown as readonly Row[],
  events: campusEvents as unknown as readonly Row[],
  services: campusServices as unknown as readonly Row[],
  bookings: serviceBookings as unknown as readonly Row[],
  opportunities: opportunities as unknown as readonly Row[],
  transactions: transactions as unknown as readonly Row[],
  subscriptions: collegeSubscriptions as unknown as readonly Row[],
  sponsorships: sponsorships as unknown as readonly Row[],
  notifications: notifications as unknown as readonly Row[],
};

/**
 * Module-level mutable store. Cached on `globalThis` so Next.js dev HMR does not
 * throw away writes (e.g. bookings created through the demo UI).
 */
interface Store {
  tables: Record<TableName, Row[]>;
  sequence: number;
}

const GLOBAL_KEY = "__campusloop_store__";

function getStore(): Store {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: Store };
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = {
      tables: Object.fromEntries(
        TABLE_NAMES.map((name) => [name, seed[name].map((row) => ({ ...row }))]),
      ) as Record<TableName, Row[]>,
      sequence: seed.bookings.length,
    };
  }
  return g[GLOBAL_KEY];
}

function nextId(prefix: string): string {
  const store = getStore();
  store.sequence += 1;
  return `${prefix}_live_${store.sequence.toString(36)}${Date.now().toString(36).slice(-4)}`;
}

/* ------------------------------------------------------------------ */
/* Query evaluation — mirrors PostgREST semantics                       */
/* ------------------------------------------------------------------ */

function isRowArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function containsTerm(haystack: unknown, term: string): boolean {
  if (typeof haystack === "string") return haystack.toLowerCase().includes(term);
  if (isRowArray(haystack)) {
    return haystack.some((v) => v.toLowerCase().includes(term));
  }
  return false;
}

function compare(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  const sa = a == null ? "" : String(a);
  const sb = b == null ? "" : String(b);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

function applyQuery(rows: readonly Row[], options: ListOptions | undefined): Row[] {
  if (!options) return [...rows];

  let out = rows.filter((row) => {
    if (options.where) {
      for (const [column, expected] of Object.entries(options.where)) {
        const actual = row[column];
        if (Array.isArray(expected)) {
          // Convenience: `where: { role: ["a", "b"] }` behaves like IN.
          if (!expected.includes(actual as string)) return false;
        } else if (actual !== expected) {
          return false;
        }
      }
    }

    if (options.whereIn) {
      for (const [column, allowed] of Object.entries(options.whereIn)) {
        if (!allowed.includes(String(row[column]))) return false;
      }
    }

    if (options.gte) {
      for (const [column, min] of Object.entries(options.gte)) {
        if (compare(row[column], min) < 0) return false;
      }
    }

    if (options.lte) {
      for (const [column, max] of Object.entries(options.lte)) {
        if (compare(row[column], max) > 0) return false;
      }
    }

    if (options.search && options.search.term.trim() !== "") {
      const term = options.search.term.trim().toLowerCase();
      if (!containsTerm(row[options.search.column], term)) return false;
    }

    return true;
  });

  if (options.orderBy) {
    const { column, ascending } = options.orderBy;
    out = [...out].sort((a, b) => compare(a[column], b[column]) * (ascending ? 1 : -1));
  }

  if (options.offset) out = out.slice(options.offset);
  if (options.startAfterId) {
    const cursor = out.findIndex((row) => row.id === options.startAfterId);
    if (cursor >= 0) out = out.slice(cursor + 1);
  }
  if (options.limit !== undefined) out = out.slice(0, options.limit);

  return out;
}

/* ------------------------------------------------------------------ */
/* Table factory                                                       */
/* ------------------------------------------------------------------ */

function createTable<T extends { id: string }>(name: TableName): WritableTable<T> {
  return {
    async list(options?: ListOptions): Promise<T[]> {
      const rows = applyQuery(getStore().tables[name], options);
      return rows as unknown as T[];
    },
    async byId(id: string): Promise<T | null> {
      const found = getStore().tables[name].find((row) => row.id === id);
      return found ? (found as unknown as T) : null;
    },
    async count(options?: ListOptions): Promise<number> {
      return applyQuery(getStore().tables[name], options).length;
    },
    async insert(row: Omit<T, "id"> & { id?: string }): Promise<T> {
      const id = row.id ?? nextId(name.slice(0, 3));
      const created = { ...row, id } as Row;
      getStore().tables[name].unshift(created);
      return created as unknown as T;
    },
    async update(id: string, patch: Partial<T>): Promise<T | null> {
      const table = getStore().tables[name];
      const index = table.findIndex((row) => row.id === id);
      if (index === -1) return null;
      const merged = { ...table[index], ...(patch as Row) };
      table[index] = merged;
      return merged as unknown as T;
    },
    async remove(id: string): Promise<boolean> {
      const table = getStore().tables[name];
      const index = table.findIndex((row) => row.id === id);
      if (index === -1) return false;
      table.splice(index, 1);
      return true;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

function buildProvider(): DataProvider {
  return {
    kind: "mock",
    label: "Seeded local data layer (zero config)",
    isMock: true,
    colleges: createTable<College>("colleges"),
    profiles: createTable<Profile>("profiles"),
    listings: createTable("listings"),
    equipment: createTable("equipment"),
    pg_listings: createTable("pg_listings"),
    teammate_posts: createTable("teammate_posts"),
    skill_profiles: createTable("skill_profiles"),
    events: createTable("events"),
    services: createTable("services"),
    bookings: createTable("bookings"),
    opportunities: createTable("opportunities"),
    transactions: createTable("transactions"),
    subscriptions: createTable("subscriptions"),
    sponsorships: createTable("sponsorships"),
    notifications: createTable("notifications"),
  };
}

const GLOBAL_PROVIDER = "__campusloop_provider__";

export function getMockProvider(): DataProvider {
  const g = globalThis as typeof globalThis & { [GLOBAL_PROVIDER]?: DataProvider };
  if (!g[GLOBAL_PROVIDER]) g[GLOBAL_PROVIDER] = buildProvider();
  return g[GLOBAL_PROVIDER];
}

/* ------------------------------------------------------------------ */
/* Aggregate stats used across the marketing pages                     */
/* ------------------------------------------------------------------ */

export async function getAggregateStats(provider: DataProvider) {
  const [students, collegesCount, gmv, bookingsDone, matches] = await Promise.all([
    provider.profiles.count(),
    provider.colleges.count(),
    provider.transactions.list(),
    provider.bookings.list(),
    provider.skill_profiles.count(),
  ]);
  return {
    students,
    colleges: collegesCount,
    gmv: gmv.reduce((acc, t) => acc + t.platform_revenue * 8, 0),
    bookings: bookingsDone.length,
    skillExchanges: matches,
  };
}

export { pricingPlans };
