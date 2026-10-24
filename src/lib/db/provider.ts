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

/**
 * Query surface that intentionally mirrors a Supabase PostgREST chain:
 *
 *   supabase.from("listings").select("*").eq("college_id", id).gte("price", 100)
 *
 * The local mock provider implements this shape, so swapping `NEXT_PUBLIC_USE_SUPABASE`
 * to `true` changes the implementation and nothing else in the app.
 */
export interface ListOptions {
  /** Equality filters, AND-ed together. */
  where?: Record<string, unknown>;
  /** `IN` filters, AND-ed with `where` and each other. */
  whereIn?: Record<string, readonly string[]>;
  /** Inclusive `>=` filters, for numeric or date columns. */
  gte?: Record<string, number>;
  /** Inclusive `<=` filters, for numeric or date columns. */
  lte?: Record<string, number>;
  /** Case-insensitive contains, over a string column or a string[] column. */
  search?: { column: string; term: string };
  orderBy?: { column: string; ascending: boolean };
  limit?: number;
  offset?: number;
  /** Firestore document ID cursor for stable, server-side listing pages. */
  startAfterId?: string;
}

export interface Table<T extends { id: string }> {
  list(options?: ListOptions): Promise<T[]>;
  byId(id: string): Promise<T | null>;
  count(options?: ListOptions): Promise<number>;
}

export interface Insertable {
  id?: string;
}

export interface WritableTable<T extends { id: string }> extends Table<T> {
  insert(row: Omit<T, "id"> & Partial<Pick<T, "id">>): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T | null>;
  remove(id: string): Promise<boolean>;
}

export type ProviderKind = "mock" | "supabase" | "firebase";

/**
 * The complete data interface. Swapping providers means returning a different
 * object of exactly this shape from `getDataProvider()`.
 */
export interface DataProvider {
  readonly kind: ProviderKind;
  readonly label: string;
  readonly isMock: boolean;

  colleges: Table<College>;
  profiles: Table<Profile>;
  listings: Table<Listing>;
  equipment: Table<Equipment>;
  pg_listings: Table<PGListing>;
  teammate_posts: Table<TeammatePost>;
  skill_profiles: Table<SkillProfile>;
  events: Table<CampusEvent>;
  services: Table<CampusService>;
  bookings: WritableTable<ServiceBooking>;
  opportunities: Table<Opportunity>;
  transactions: Table<Transaction>;
  subscriptions: Table<CollegeSubscription>;
  sponsorships: Table<Sponsorship>;
  notifications: Table<Notification>;
}

/** Named tables, used by the generic mock engine. */
export const TABLE_NAMES = [
  "colleges",
  "profiles",
  "listings",
  "equipment",
  "pg_listings",
  "teammate_posts",
  "skill_profiles",
  "events",
  "services",
  "bookings",
  "opportunities",
  "transactions",
  "subscriptions",
  "sponsorships",
  "notifications",
] as const;

export type TableName = (typeof TABLE_NAMES)[number];
