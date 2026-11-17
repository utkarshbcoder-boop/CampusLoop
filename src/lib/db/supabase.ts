import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { College, Profile } from "@/lib/types";
import {
  type DataProvider,
  type ListOptions,
  type TableName,
  type WritableTable,
} from "./provider";

/**
 * Real Supabase provider — the "how to swap" path.
 *
 * Implements the exact same `DataProvider` interface as the local mock in
 * `mock.ts`, translating the neutral `ListOptions` into a PostgREST builder:
 *
 *   supabase.from("listings").select("*").eq("college_id", id).gte("price", 500)
 *
 * Only loaded when `NEXT_PUBLIC_USE_SUPABASE=true` and both the URL and the anon
 * key are set — see `index.ts`. Prerequisite: run `schema.sql` first.
 */

/** The subset of the PostgREST builder we rely on, declared structurally. */
interface PostgrestChain {
  eq(column: string, value: unknown): PostgrestChain;
  in(column: string, values: readonly string[]): PostgrestChain;
  gte(column: string, value: number): PostgrestChain;
  lte(column: string, value: number): PostgrestChain;
  ilike(column: string, pattern: string): PostgrestChain;
  order(column: string, options: { ascending: boolean }): PostgrestChain;
  limit(count: number): PostgrestChain;
  range(from: number, to: number): PostgrestChain;
  then<R>(onFulfilled: (value: unknown) => R): PromiseLike<R>;
}

interface SelectResult {
  data: unknown[] | null;
  error: { message: string } | null;
}

interface CountResult {
  count: number | null;
  error: { message: string } | null;
}

interface InsertResult {
  data: unknown | null;
  error: { message: string } | null;
}

function startChain(client: SupabaseClient, table: TableName, countOnly: boolean): PostgrestChain {
  const builder = client.from(table) as unknown as {
    select(
      columns: string,
      options: { count: "exact" | null; head: boolean },
    ): PostgrestChain;
  };
  return builder.select("*", { count: countOnly ? "exact" : null, head: countOnly });
}

function applyFilters(chain: PostgrestChain, options: ListOptions | undefined): PostgrestChain {
  if (!options) return chain;
  let q = chain;

  if (options.where) {
    for (const [column, value] of Object.entries(options.where)) {
      q = Array.isArray(value) ? q.in(column, value as string[]) : q.eq(column, value);
    }
  }
  if (options.whereIn) {
    for (const [column, values] of Object.entries(options.whereIn)) {
      q = q.in(column, values);
    }
  }
  if (options.gte) {
    for (const [column, value] of Object.entries(options.gte)) {
      q = q.gte(column, value);
    }
  }
  if (options.lte) {
    for (const [column, value] of Object.entries(options.lte)) {
      q = q.lte(column, value);
    }
  }
  if (options.search && options.search.term.trim() !== "") {
    // Strip PostgREST-reserved characters so a stray % or comma cannot break the filter.
    const term = options.search.term.trim().replace(/[%,()]/g, " ");
    q = q.ilike(options.search.column, `%${term}%`);
  }
  if (options.orderBy) {
    q = q.order(options.orderBy.column, { ascending: options.orderBy.ascending });
  }
  if (options.limit !== undefined) {
    q = q.limit(options.limit);
  }
  if (options.offset) {
    q = q.range(options.offset, options.offset + (options.limit ?? 1000) - 1);
  }
  return q;
}

function createTable<T extends { id: string }>(client: SupabaseClient, table: TableName): WritableTable<T> {
  /**
   * Fill safe defaults for fields older rows may be missing (NULL / never
   * written), matching the Firestore provider's `mapDoc` so callers can
   * spread `listing.tags` / `listing.highlights` without crashing.
   */
  const mapRow = (row: unknown): T => {
    const record = row as Record<string, unknown>;
    for (const field of ["tags", "highlights", "image_urls", "specs"]) {
      if (!Array.isArray(record[field])) record[field] = [];
    }
    for (const field of ["author", "edition", "subject"]) {
      record[field] = record[field] ?? "";
    }
    return record as T;
  };

  const read = async (options?: ListOptions): Promise<T[]> => {
    const chain = applyFilters(startChain(client, table, false), options);
    const result = (await chain) as SelectResult;
    if (result.error) {
      throw new Error(`[CampusLoop/Supabase] select from ${table}: ${result.error.message}`);
    }
    return (result.data ?? []).map(mapRow);
  };

  return {
    list: read,

    async byId(id: string): Promise<T | null> {
      const rows = await read({ where: { id }, limit: 1 });
      return rows[0] ?? null;
    },

    async count(options?: ListOptions): Promise<number> {
      let chain = startChain(client, table, true);
      if (options?.where) {
        for (const [column, value] of Object.entries(options.where)) {
          chain = chain.eq(column, value);
        }
      }
      if (options?.whereIn) {
        for (const [column, values] of Object.entries(options.whereIn)) {
          chain = chain.in(column, values);
        }
      }
      if (options?.search && options.search.term.trim() !== "") {
        const term = options.search.term.trim().replace(/[%,()]/g, " ");
        chain = chain.ilike(options.search.column, `%${term}%`);
      }
      const result = (await chain) as CountResult;
      if (result.error) {
        throw new Error(`[CampusLoop/Supabase] count on ${table}: ${result.error.message}`);
      }
      return result.count ?? 0;
    },

    async insert(row: Omit<T, "id"> & { id?: string }): Promise<T> {
      const builder = client.from(table);
      const result = (await builder.insert(row as never).select().single()) as InsertResult;
      if (result.error) {
        throw new Error(`[CampusLoop/Supabase] insert into ${table}: ${result.error.message}`);
      }
      return result.data as T;
    },

    async update(id: string, patch: Partial<T>): Promise<T | null> {
      const builder = client.from(table);
      const result = (await builder.update(patch as never).eq("id", id).select().maybeSingle()) as InsertResult;
      if (result.error) {
        throw new Error(`[CampusLoop/Supabase] update ${table}: ${result.error.message}`);
      }
      return (result.data as T | null) ?? null;
    },

    async remove(id: string): Promise<boolean> {
      const builder = client.from(table);
      const result = (await builder.delete().eq("id", id)) as { error: { message: string } | null };
      if (result.error) {
        throw new Error(`[CampusLoop/Supabase] delete from ${table}: ${result.error.message}`);
      }
      return true;
    },
  };
}

export function getSupabaseProvider(): DataProvider {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "[CampusLoop] NEXT_PUBLIC_USE_SUPABASE=true but NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing. " +
        "Copy .env.example to .env.local and fill them in, or set NEXT_PUBLIC_USE_SUPABASE=false to use the seeded local data layer.",
    );
  }

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    kind: "supabase",
    label: `Supabase (${new URL(url).host})`,
    isMock: false,
    colleges: createTable<College>(client, "colleges"),
    profiles: createTable<Profile>(client, "profiles"),
    listings: createTable(client, "listings"),
    equipment: createTable(client, "equipment"),
    pg_listings: createTable(client, "pg_listings"),
    teammate_posts: createTable(client, "teammate_posts"),
    skill_profiles: createTable(client, "skill_profiles"),
    events: createTable(client, "events"),
    services: createTable(client, "services"),
    bookings: createTable(client, "bookings"),
    opportunities: createTable(client, "opportunities"),
    transactions: createTable(client, "transactions"),
    subscriptions: createTable(client, "subscriptions"),
    sponsorships: createTable(client, "sponsorships"),
    notifications: createTable(client, "notifications"),
  };
}
