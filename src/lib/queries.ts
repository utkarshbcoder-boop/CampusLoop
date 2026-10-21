import { getDataProvider, type ListOptions } from "@/lib/db";
import type { College, Equipment, EquipmentCategory, Listing, MarketplaceItemType, PGListing, Profile } from "@/lib/types";
import { DEFAULT_PROFILE_ID, profileById } from "@/lib/data/profiles";

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
/* Current demo user                                                   */
/* ------------------------------------------------------------------ */

export async function getCurrentProfile(): Promise<Profile> {
  const provider = await getDataProvider();
  const fromDb = await provider.profiles.byId(DEFAULT_PROFILE_ID);
  const base =
    fromDb ??
    profileById(DEFAULT_PROFILE_ID) ??
    (await provider.profiles.list())[0];
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
  const provider = await getDataProvider();
  return provider.colleges.list({ orderBy: { column: "campusloop_students", ascending: false } });
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
  const provider = await getDataProvider();
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
}

export async function getListing(id: string): Promise<Listing | null> {
  const provider = await getDataProvider();
  return provider.listings.byId(id);
}

export async function getSecondhandListings(itemType?: MarketplaceItemType): Promise<Listing[]> {
  const provider = await getDataProvider();
  const rows = await provider.listings.list({
    orderBy: { column: "created_at", ascending: false },
  });
  return rows.filter((listing) => {
    if (listing.kind !== "sell") return false;
    if (!itemType) return !listing.item_type || listing.item_type === "book" || listing.item_type === "device";
    if (itemType === "book") return !listing.item_type || listing.item_type === "book";
    return listing.item_type === itemType;
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
  const provider = await getDataProvider();
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
}

export async function getEquipmentItem(id: string): Promise<Equipment | null> {
  const provider = await getDataProvider();
  return provider.equipment.byId(id);
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
  const provider = await getDataProvider();
  const options: ListOptions = { orderBy: PG_SORTS[filters.sort] ?? PG_SORTS.rent_asc };
  if (filters.type && filters.type !== "all") options.where = { type: filters.type };
  if (filters.gender && filters.gender !== "all") options.where = { ...options.where, gender: filters.gender };
  if (filters.maxRent) options.lte = { rent: filters.maxRent };
  if (filters.maxDistance) options.lte = { ...options.lte, distance_km: filters.maxDistance };
  if (filters.q) options.search = { column: "title", term: filters.q };
  return provider.pg_listings.list(options);
}

export async function loadMatchContext() {
  const provider = await getDataProvider();
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
}
