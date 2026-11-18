import { getDataProvider, getMockProvider, type DataProvider, type ListOptions } from "@/lib/db";
import type { College, DeviceCategory, Equipment, EquipmentCategory, Listing, MarketplaceItemType, PGListing, Profile } from "@/lib/types";
import { DEFAULT_PROFILE_ID, profileById } from "@/lib/data/profiles";
import { getDeviceCategory } from "@/lib/marketplaceCategories";

/**
 * Read-side query helpers used by the app pages.
 *
 * Every module here goes through the `DataProvider` interface, so these functions
 * work unchanged against the seeded local data layer or a real Supabase project.
 */

export type SearchParams = Record<string, string | string[] | undefined>;

/** Collapse Next.js' `string | string[] | undefined` into a single string. */
export function sp(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/* ------------------------------------------------------------------ */
/* Graceful degradation                                                */
/* ------------------------------------------------------------------ */

/**
 * Run a read against the active data provider, falling back to the seeded
 * sample store when the live backend rejects it — e.g. Firestore security
 * rules are not deployed yet, so every read is permission-denied and used
 * to 500 the force-dynamic pages (`/marketplace`, `/books`, `/devices`, …).
 *
 * Sample mode never falls back (the active provider already *is* the sample
 * store), so a failure there still surfaces as a real error. Every fallback
 * is logged so the underlying cause stays visible in server logs.
 */
async function readWithFallback<T>(label: string, read: (provider: DataProvider) => Promise<T>): Promise<T> {
  let provider: DataProvider;
  try {
    provider = await getDataProvider();
  } catch (cause) {
    console.error(`${label}: data provider unavailable, serving sample data:`, cause);
    return read(getMockProvider());
  }
  // Sample mode: the active provider already *is* the sample store, so a
  // failure there is a real bug — let it propagate instead of masking it.
  if (provider.isMock) return read(provider);
  try {
    return await read(provider);
  } catch (cause) {
    console.error(`${label}: live read failed, serving sample data:`, cause);
    return read(getMockProvider());
  }
}

/* ------------------------------------------------------------------ */
/* Current demo user                                                   */
/* ------------------------------------------------------------------ */

export async function getCurrentProfile(): Promise<Profile> {
  let provider: DataProvider;
  try {
    provider = await getDataProvider();
  } catch (cause) {
    console.error("getCurrentProfile: data provider unavailable, using seed:", cause);
    provider = getMockProvider();
  }
  // Firestore profile reads require a signed-in session (rules restrict
  // them to signed-in users), but this runs in a server component with no
  // auth state — treat a denied/failed read as "no DB profile" and fall
  // back to the seeded demo profile below.
  let fromDb: Profile | null = null;
  try {
    fromDb = await provider.profiles.byId(DEFAULT_PROFILE_ID);
  } catch (cause) {
    console.error("getCurrentProfile: profile read failed, using seed:", cause);
  }
  let firstRow: Profile | null = null;
  if (!fromDb && !profileById(DEFAULT_PROFILE_ID)) {
    firstRow = (await provider.profiles.list().catch(() => [] as Profile[]))[0] ?? null;
  }
  const base = fromDb ?? profileById(DEFAULT_PROFILE_ID) ?? firstRow;
  if (!base) throw new Error("No profiles found. Run the seed script or check your data provider.");

  // Strip Firestore Timestamp objects (created by serverTimestamp()) down
  // to plain ISO strings — Client Components can't receive Timestamps.
  const clean = (p: Profile): Profile => {
    const out = { ...p } as Record<string, unknown>;
    for (const [k, v] of Object.entries(out)) {
      if (v && typeof v === "object" && "seconds" in (v as Record<string, unknown>)) {
        out[k] = new Date((v as { seconds: number }).seconds * 1000).toISOString();
      }
    }
    return out as unknown as Profile;
  };
  return clean(base);
}

export async function getColleges(): Promise<College[]> {
  return readWithFallback("getColleges", (provider) =>
    provider.colleges.list({ orderBy: { column: "campusloop_students", ascending: false } }),
  );
}

/* ------------------------------------------------------------------ */
/* Module queries                                                      */
/* ------------------------------------------------------------------ */

export interface ListingFilters {
  q: string;
  kind: string;
  subject: string;
  condition: string;
  college: string;
  maxPrice: number | null;
  sort: string;
}

export function parseListingFilters(params: SearchParams): ListingFilters {
  const maxRaw = sp(params.maxprice);
  return {
    q: sp(params.q),
    kind: sp(params.kind),
    subject: sp(params.subject),
    condition: sp(params.condition),
    college: sp(params.college),
    maxPrice: maxRaw ? Number.parseInt(maxRaw, 10) : null,
    sort: sp(params.sort) || "recent",
  };
}

const LISTING_SORTS: Record<string, { column: string; ascending: boolean }> = {
  recent: { column: "created_at", ascending: false },
  price_asc: { column: "price", ascending: true },
  price_desc: { column: "price", ascending: false },
  popular: { column: "views", ascending: false },
  saved: { column: "saves", ascending: false },
};

export async function getListings(filters: ListingFilters): Promise<Listing[]> {
  return readWithFallback("getListings", async (provider) => {
    const options: ListOptions = {};

    if (filters.college && filters.college !== "all") options.where = { college_id: filters.college };
    if (filters.kind && filters.kind !== "all") options.where = { ...options.where, kind: filters.kind };
    if (filters.subject && filters.subject !== "all") options.where = { ...options.where, subject: filters.subject };
    if (filters.condition && filters.condition !== "all")
      options.where = { ...options.where, condition: filters.condition };
    if (filters.maxPrice) options.lte = { price: filters.maxPrice };

    const rows = await provider.listings.list({
      ...options,
      orderBy: LISTING_SORTS[filters.sort] ?? LISTING_SORTS.recent,
    });
    const bookRows = rows.filter((listing) => !listing.item_type || listing.item_type === "book");

    // Free-text is matched in memory across several fields so that searching an
    // author ("Cormen") or a subject finds the book, not just a title hit.
    if (filters.q) {
      const term = filters.q.trim().toLowerCase();
      return bookRows.filter((l) =>
        [l.title, l.author, l.subject, l.semester, l.condition, l.kind, ...l.tags]
          .join(" ")
          .toLowerCase()
          .includes(term),
      );
    }

    return bookRows;
  });
}

const BOOK_PAGE_SIZE = 20;
const LISTING_BATCH_SIZE = 50;

export async function getBookListingsPage(
  filters: ListingFilters,
  { after = "", page = 1 }: { after?: string; page?: number } = {},
): Promise<{ listings: Listing[]; hasMore: boolean; nextAfter: string; nextPage: number }> {
  return readWithFallback("getBookListingsPage", async (provider) => {
    const options: ListOptions = {
      orderBy: LISTING_SORTS[filters.sort] ?? LISTING_SORTS.recent,
      limit: LISTING_BATCH_SIZE,
    };

    const isCursorProvider = provider.kind === "firebase";
    let cursor = isCursorProvider ? after : "";
    let offset = 0;
    let skippedBooks = 0;
    const matches: Listing[] = [];
    let exhausted = false;
    const term = filters.q.trim().toLowerCase();

    while (matches.length <= BOOK_PAGE_SIZE && !exhausted) {
      const rows = await provider.listings.list({
        ...options,
        ...(isCursorProvider && cursor ? { startAfterId: cursor } : { offset }),
      });
      if (rows.length === 0) break;
      offset += rows.length;
      cursor = rows[rows.length - 1].id;
      exhausted = rows.length < LISTING_BATCH_SIZE;

      for (const listing of rows) {
        if (listing.item_type && listing.item_type !== "book") continue;
        if (filters.college && filters.college !== "all" && listing.college_id !== filters.college) continue;
        if (filters.kind && filters.kind !== "all" && listing.kind !== filters.kind) continue;
        if (filters.subject && filters.subject !== "all" && listing.subject !== filters.subject) continue;
        if (filters.condition && filters.condition !== "all" && listing.condition !== filters.condition) continue;
        if (filters.maxPrice && listing.price > filters.maxPrice) continue;
        if (term && ![
          listing.title,
          listing.author,
          listing.subject,
          listing.semester,
          listing.condition,
          listing.kind,
          ...listing.tags,
        ].join(" ").toLowerCase().includes(term)) continue;
        if (!isCursorProvider && skippedBooks < (page - 1) * BOOK_PAGE_SIZE) {
          skippedBooks += 1;
          continue;
        }
        matches.push(listing);
        if (matches.length > BOOK_PAGE_SIZE) break;
      }
    }

    const pageListings = matches.slice(0, BOOK_PAGE_SIZE);
    return {
      listings: pageListings,
      hasMore: matches.length > BOOK_PAGE_SIZE,
      nextAfter: isCursorProvider ? pageListings.at(-1)?.id ?? "" : "",
      nextPage: page + 1,
    };
  });
}

export async function getDeviceListingsPage(
  { q, category }: { q: string; category: DeviceCategory | "all" },
  { after = "", page = 1 }: { after?: string; page?: number } = {},
): Promise<{ listings: Listing[]; hasMore: boolean; nextAfter: string; nextPage: number }> {
  return readWithFallback("getDeviceListingsPage", async (provider) => {
    const isCursorProvider = provider.kind === "firebase";
    const options: ListOptions = {
      orderBy: { column: "created_at", ascending: false },
      limit: LISTING_BATCH_SIZE,
    };
    let cursor = isCursorProvider ? after : "";
    let offset = 0;
    let skippedDevices = 0;
    const matches: Listing[] = [];
    let exhausted = false;
    const term = q.trim().toLowerCase();

    while (matches.length <= BOOK_PAGE_SIZE && !exhausted) {
      const rows = await provider.listings.list({
        ...options,
        ...(isCursorProvider && cursor ? { startAfterId: cursor } : { offset }),
      });
      if (rows.length === 0) break;
      offset += rows.length;
      cursor = rows[rows.length - 1].id;
      exhausted = rows.length < LISTING_BATCH_SIZE;

      for (const listing of rows) {
        if (listing.kind !== "sell" || listing.item_type !== "device") continue;
        if (category !== "all" && getDeviceCategory(listing) !== category) continue;
        if (term && ![
          listing.title,
          listing.author,
          listing.edition,
          listing.subject,
          listing.description,
          listing.pickup_location ?? "",
        ].join(" ").toLowerCase().includes(term)) continue;
        if (!isCursorProvider && skippedDevices < (page - 1) * BOOK_PAGE_SIZE) {
          skippedDevices += 1;
          continue;
        }
        matches.push(listing);
        if (matches.length > BOOK_PAGE_SIZE) break;
      }
    }

    const pageListings = matches.slice(0, BOOK_PAGE_SIZE);
    return {
      listings: pageListings,
      hasMore: matches.length > BOOK_PAGE_SIZE,
      nextAfter: isCursorProvider ? pageListings.at(-1)?.id ?? "" : "",
      nextPage: page + 1,
    };
  });
}

export async function getListing(id: string): Promise<Listing | null> {
  return readWithFallback("getListing", (provider) => provider.listings.byId(id));
}

export async function getSecondhandListings(itemType?: MarketplaceItemType): Promise<Listing[]> {
  return readWithFallback("getSecondhandListings", async (provider) => {
    const rows = await provider.listings.list({
      orderBy: { column: "created_at", ascending: false },
    });
    return rows.filter((listing) => {
      if (listing.kind !== "sell") return false;
      if (!itemType) return !listing.item_type || listing.item_type === "book" || listing.item_type === "device";
      if (itemType === "book") return !listing.item_type || listing.item_type === "book";
      return listing.item_type === itemType;
    });
  });
}

export interface EquipmentFilters {
  q: string;
  category: string;
  college: string;
  maxDayRate: number | null;
  sort: string;
}

const EQUIPMENT_SORTS: Record<string, { column: string; ascending: boolean }> = {
  rate_asc: { column: "day_rate", ascending: true },
  rate_desc: { column: "day_rate", ascending: false },
  rating: { column: "rating", ascending: false },
  popular: { column: "rentals_count", ascending: false },
  newest: { column: "created_at", ascending: false },
};

export function parseEquipmentFilters(params: SearchParams): EquipmentFilters {
  const rateRaw = sp(params.rate);
  return {
    q: sp(params.q),
    category: sp(params.category),
    college: sp(params.college),
    maxDayRate: rateRaw ? Number.parseInt(rateRaw, 10) : null,
    sort: sp(params.sort) || "rate_asc",
  };
}

export async function getEquipment(filters: EquipmentFilters): Promise<Equipment[]> {
  return readWithFallback("getEquipment", async (provider) => {
    const options: ListOptions = {
      orderBy: EQUIPMENT_SORTS[filters.sort] ?? EQUIPMENT_SORTS.rate_asc,
    };
    if (filters.category && filters.category !== "all") {
      options.where = { category: filters.category as EquipmentCategory };
    }
    if (filters.college && filters.college !== "all") {
      options.where = { ...options.where, college_id: filters.college };
    }
    if (filters.maxDayRate) options.lte = { day_rate: filters.maxDayRate };

    const rows = await provider.equipment.list(options);
    if (!filters.q) return rows;
    const term = filters.q.trim().toLowerCase();
    return rows.filter((item) =>
      [item.name, item.brand, item.category, item.description, ...item.specs]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  });
}

export async function getEquipmentItem(id: string): Promise<Equipment | null> {
  return readWithFallback("getEquipmentItem", (provider) => provider.equipment.byId(id));
}

export interface PGFilters {
  q: string;
  type: string;
  gender: string;
  maxRent: number | null;
  maxDistance: number | null;
  sort: string;
}

const PG_SORTS: Record<string, { column: string; ascending: boolean }> = {
  rent_asc: { column: "rent", ascending: true },
  rent_desc: { column: "rent", ascending: false },
  distance: { column: "distance_km", ascending: true },
  popular: { column: "saves", ascending: false },
  newest: { column: "created_at", ascending: false },
};

export function parsePGFilters(params: SearchParams): PGFilters {
  const rentRaw = sp(params.rent);
  const distRaw = sp(params.distance);
  return {
    q: sp(params.q),
    type: sp(params.type),
    gender: sp(params.gender),
    maxRent: rentRaw ? Number.parseInt(rentRaw, 10) : null,
    maxDistance: distRaw ? Number.parseInt(distRaw, 10) : null,
    sort: sp(params.sort) || "rent_asc",
  };
}

export async function getPGListings(filters: PGFilters): Promise<PGListing[]> {
  return readWithFallback("getPGListings", async (provider) => {
    const options: ListOptions = { orderBy: PG_SORTS[filters.sort] ?? PG_SORTS.rent_asc };
    if (filters.type && filters.type !== "all") options.where = { type: filters.type };
    if (filters.gender && filters.gender !== "all") options.where = { ...options.where, gender: filters.gender };
    if (filters.maxRent) options.lte = { rent: filters.maxRent };
    if (filters.maxDistance) options.lte = { ...options.lte, distance_km: filters.maxDistance };
    if (filters.q) options.search = { column: "title", term: filters.q };
    return provider.pg_listings.list(options);
  });
}

export async function loadMatchContext() {
  return readWithFallback("loadMatchContext", async (provider) => {
    const [colleges, profiles, listings, equipment, pgListings, teammatePosts, skillProfiles, services, events] =
      await Promise.all([
        provider.colleges.list(),
        provider.profiles.list(),
        provider.listings.list({ where: { status: "available" } }).then((rows) =>
          rows.filter((listing) => !listing.item_type || listing.item_type === "book"),
        ),
        provider.equipment.list(),
        provider.pg_listings.list(),
        provider.teammate_posts.list(),
        provider.skill_profiles.list(),
        provider.services.list(),
        provider.events.list(),
      ]);
    return {
      colleges,
      profiles,
      listings,
      equipment,
      pgListings,
      teammatePosts,
      skillProfiles,
      services,
      events,
    };
  });
}
