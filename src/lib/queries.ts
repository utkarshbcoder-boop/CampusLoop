import { getDataProvider, type ListOptions } from "@/lib/db";
import type {
  CampusEvent,
  CampusService,
  College,
  Equipment,
  Listing,
  MatchPreferences,
  PGListing,
  Profile,
  ServiceBooking,
  SkillProfile,
  TeammatePost,
} from "@/lib/types";
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

export function spNum(value: string | string[] | undefined, fallback: number): number {
  const parsed = Number.parseFloat(sp(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function spList(value: string | string[] | undefined): string[] {
  const raw = sp(value);
  if (!raw) return [];
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
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

export function collegeLookup(colleges: College[]) {
  const map = new Map(colleges.map((c) => [c.id, c]));
  return (id: string | null | undefined): College | undefined => (id ? map.get(id) : undefined);
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

  // Free-text is matched in memory across several fields so that searching an
  // author ("Cormen") or a subject finds the book, not just a title hit.
  if (filters.q) {
    const term = filters.q.trim().toLowerCase();
    return rows.filter((l) =>
      [l.title, l.author, l.subject, l.semester, l.condition, l.kind, ...l.tags]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }

  return rows;
}

export async function getListing(id: string): Promise<Listing | null> {
  const provider = await getDataProvider();
  return provider.listings.byId(id);
}

export interface EquipmentFilters {
  q: string;
  category: string;
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
    maxDayRate: rateRaw ? Number.parseInt(rateRaw, 10) : null,
    sort: sp(params.sort) || "rate_asc",
  };
}

export async function getEquipment(filters: EquipmentFilters): Promise<Equipment[]> {
  const provider = await getDataProvider();
  const options: ListOptions = { orderBy: EQUIPMENT_SORTS[filters.sort] ?? EQUIPMENT_SORTS.rate_asc };
  if (filters.category && filters.category !== "all") options.where = { category: filters.category };
  if (filters.maxDayRate) options.lte = { day_rate: filters.maxDayRate };
  if (filters.q) options.search = { column: "name", term: filters.q };
  return provider.equipment.list(options);
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

export async function getPGListing(id: string): Promise<PGListing | null> {
  const provider = await getDataProvider();
  return provider.pg_listings.byId(id);
}

export interface TeamFilters {
  q: string;
  type: string;
  tier: string;
  mode: string;
  sort: string;
}

const TEAM_SORTS: Record<string, { column: string; ascending: boolean }> = {
  recent: { column: "created_at", ascending: false },
  prize: { column: "prize_pool", ascending: false },
  applicants: { column: "applicants", ascending: false },
  views: { column: "views", ascending: false },
  weeks: { column: "timeline_weeks", ascending: true },
};

export function parseTeamFilters(params: SearchParams): TeamFilters {
  return {
    q: sp(params.q),
    type: sp(params.type),
    tier: sp(params.tier),
    mode: sp(params.mode),
    sort: sp(params.sort) || "recent",
  };
}

export async function getTeammatePosts(filters: TeamFilters): Promise<TeammatePost[]> {
  const provider = await getDataProvider();
  const options: ListOptions = { orderBy: TEAM_SORTS[filters.sort] ?? TEAM_SORTS.recent };
  if (filters.type && filters.type !== "all") options.where = { project_type: filters.type };
  if (filters.tier && filters.tier !== "all") options.where = { ...options.where, hackathon_tier: filters.tier };
  if (filters.mode && filters.mode !== "all") options.where = { ...options.where, mode: filters.mode };
  if (filters.q) options.search = { column: "title", term: filters.q };
  return provider.teammate_posts.list(options);
}

export async function getTeammatePost(id: string): Promise<TeammatePost | null> {
  const provider = await getDataProvider();
  return provider.teammate_posts.byId(id);
}

export interface SkillFilters {
  q: string;
  kind: string;
  category: string;
  sort: string;
}

const SKILL_SORTS: Record<string, { column: string; ascending: boolean }> = {
  rating: { column: "rating", ascending: false },
  sessions: { column: "sessions_completed", ascending: false },
  cheapest: { column: "credit_rate", ascending: true },
  newest: { column: "created_at", ascending: false },
};

export function parseSkillFilters(params: SearchParams): SkillFilters {
  return {
    q: sp(params.q),
    kind: sp(params.kind),
    category: sp(params.category),
    sort: sp(params.sort) || "rating",
  };
}

export async function getSkillProfiles(filters: SkillFilters): Promise<SkillProfile[]> {
  const provider = await getDataProvider();
  const options: ListOptions = { orderBy: SKILL_SORTS[filters.sort] ?? SKILL_SORTS.rating };
  if (filters.kind && filters.kind !== "all") options.where = { kind: filters.kind };
  if (filters.category && filters.category !== "all") options.where = { ...options.where, category: filters.category };
  if (filters.q) options.search = { column: "title", term: filters.q };
  return provider.skill_profiles.list(options);
}

export async function getSkillProfile(id: string): Promise<SkillProfile | null> {
  const provider = await getDataProvider();
  return provider.skill_profiles.byId(id);
}

export interface EventFilters {
  q: string;
  category: string;
  audience: string;
  price: string;
  sort: string;
}

const EVENT_SORTS: Record<string, { column: string; ascending: boolean }> = {
  soonest: { column: "starts_at", ascending: true },
  popular: { column: "rsvp_count", ascending: false },
  newest: { column: "starts_at", ascending: true },
  capacity: { column: "capacity", ascending: false },
};

export function parseEventFilters(params: SearchParams): EventFilters {
  return {
    q: sp(params.q),
    category: sp(params.category),
    audience: sp(params.audience),
    price: sp(params.price),
    sort: sp(params.sort) || "soonest",
  };
}

export async function getEvents(filters: EventFilters): Promise<CampusEvent[]> {
  const provider = await getDataProvider();
  const options: ListOptions = { orderBy: EVENT_SORTS[filters.sort] ?? EVENT_SORTS.soonest };
  if (filters.category && filters.category !== "all") options.where = { category: filters.category };
  if (filters.price === "free") options.where = { ...options.where, free: true };
  if (filters.q) options.search = { column: "title", term: filters.q };
  let rows = await provider.events.list(options);
  if (filters.audience === "mine") {
    const profile = await getCurrentProfile();
    rows = rows.filter((e) => e.college_id === profile.college_id);
  }
  return rows;
}

export async function getEvent(id: string): Promise<CampusEvent | null> {
  const provider = await getDataProvider();
  return provider.events.byId(id);
}

export interface ServiceFilters {
  q: string;
  category: string;
  maxPrice: number | null;
  minRating: number | null;
  sort: string;
}

const SERVICE_SORTS: Record<string, { column: string; ascending: boolean }> = {
  rating: { column: "rating", ascending: false },
  price_asc: { column: "base_price", ascending: true },
  fastest: { column: "turnaround_hours", ascending: true },
  popular: { column: "jobs_completed", ascending: false },
  newest: { column: "provider_since", ascending: false },
};

export function parseServiceFilters(params: SearchParams): ServiceFilters {
  const priceRaw = sp(params.price);
  const ratingRaw = sp(params.minrating);
  return {
    q: sp(params.q),
    category: sp(params.category),
    maxPrice: priceRaw ? Number.parseInt(priceRaw, 10) : null,
    minRating: ratingRaw ? Number.parseFloat(ratingRaw) : null,
    sort: sp(params.sort) || "rating",
  };
}

export async function getServices(filters: ServiceFilters): Promise<CampusService[]> {
  const provider = await getDataProvider();
  const options: ListOptions = { orderBy: SERVICE_SORTS[filters.sort] ?? SERVICE_SORTS.rating };
  if (filters.category && filters.category !== "all") options.where = { category: filters.category };
  if (filters.maxPrice) options.lte = { base_price: filters.maxPrice };
  if (filters.minRating) options.gte = { rating: filters.minRating };
  if (filters.q) options.search = { column: "name", term: filters.q };
  return provider.services.list(options);
}

export async function getService(id: string): Promise<CampusService | null> {
  const provider = await getDataProvider();
  return provider.services.byId(id);
}

export async function getBookingsFor(profileId: string): Promise<ServiceBooking[]> {
  const provider = await getDataProvider();
  return provider.bookings.list({
    where: { student_id: profileId },
    orderBy: { column: "created_at", ascending: false },
  });
}

export interface OpportunityFilters {
  q: string;
  type: string;
  mode: string;
  minStipend: number | null;
  sort: string;
}

const OPPORTUNITY_SORTS: Record<string, { column: string; ascending: boolean }> = {
  deadline: { column: "deadline", ascending: true },
  stipend: { column: "monthly_pay", ascending: false },
  award: { column: "award_value", ascending: false },
  openings: { column: "openings", ascending: false },
  recent: { column: "posted_at", ascending: false },
};

export function parseOpportunityFilters(params: SearchParams): OpportunityFilters {
  const stipendRaw = sp(params.stipend);
  return {
    q: sp(params.q),
    type: sp(params.type),
    mode: sp(params.mode),
    minStipend: stipendRaw ? Number.parseInt(stipendRaw, 10) : null,
    sort: sp(params.sort) || "deadline",
  };
}

export async function getOpportunities(filters: OpportunityFilters) {
  const provider = await getDataProvider();
  const options: ListOptions = { orderBy: OPPORTUNITY_SORTS[filters.sort] ?? OPPORTUNITY_SORTS.deadline };
  if (filters.type && filters.type !== "all") options.where = { type: filters.type };
  if (filters.mode && filters.mode !== "all") options.where = { ...options.where, mode: filters.mode };
  if (filters.minStipend) options.gte = { monthly_pay: filters.minStipend };
  if (filters.q) options.search = { column: "title", term: filters.q };
  return provider.opportunities.list(options);
}

export async function getOpportunity(id: string) {
  const provider = await getDataProvider();
  return provider.opportunities.byId(id);
}

/* ------------------------------------------------------------------ */
/* Match Lab                                                           */
/* ------------------------------------------------------------------ */

export function parsePreferences(params: SearchParams, base: MatchPreferences): MatchPreferences {
  return {
    college_id: sp(params.college) || base.college_id,
    skills: spList(params.skills),
    interests: spList(params.interests),
    budget_min: spNum(params.min, base.budget_min),
    budget_max: spNum(params.max, base.budget_max),
    max_distance_km: spNum(params.distance, base.max_distance_km),
    sleep_schedule: (sp(params.sleep) || base.sleep_schedule) as MatchPreferences["sleep_schedule"],
    cleanliness: spNum(params.clean, base.cleanliness),
    food: (sp(params.food) || base.food) as MatchPreferences["food"],
    smoking: (sp(params.smoking) || base.smoking) as MatchPreferences["smoking"],
    gender: (sp(params.gender) || base.gender) as MatchPreferences["gender"],
    availability: spList(params.availability),
    hours_per_week: spNum(params.hours, base.hours_per_week),
  };
}

export function defaultPreferences(profile: Profile): MatchPreferences {
  return {
    college_id: profile.college_id,
    skills: profile.skills,
    interests: profile.interests,
    budget_min: profile.budget_min,
    budget_max: profile.budget_max,
    max_distance_km: 8,
    sleep_schedule: profile.sleep_schedule,
    cleanliness: profile.cleanliness,
    food: profile.food,
    smoking: profile.smoking,
    gender: profile.gender,
    availability: profile.available_slots,
    hours_per_week: 8,
  };
}

export async function loadMatchContext() {
  const provider = await getDataProvider();
  const [colleges, profiles, listings, equipment, pgListings, teammatePosts, skillProfiles, services, events] =
    await Promise.all([
      provider.colleges.list(),
      provider.profiles.list(),
      provider.listings.list({ where: { status: "available" } }),
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
