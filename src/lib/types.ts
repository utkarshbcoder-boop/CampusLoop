/**
 * CampusLoop domain model.
 *
 * These types are the single source of truth for both data providers:
 *  - `src/lib/db/mock.ts`     (seeded in-memory / zero-config)
 *  - `src/lib/db/supabase.ts` (real Supabase Postgres)
 *
 * Field names are snake_case to match the Postgres columns in `schema.sql`,
 * so a row from either provider is structurally identical.
 */

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

export type ID = string;

export type ISODate = string;

export type Rupee = number;

export type CollegeTier = "Public" | "BITS" | "Private" | "State";

export type VerificationLevel = "unverified" | "student_id" | "college_email" | "aadhaar";

export type DayOfWeek =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";

export type SleepSchedule = "early_bird" | "night_owl" | "flexible";
export type FoodPreference = "veg" | "non_veg" | "vegan" | "egg_lucky";
export type SmokingPolicy = "smoker" | "non_smoker" | "no_preference";
export type GenderPreference = "any" | "male" | "female";

/* ------------------------------------------------------------------ */
/* Colleges                                                            */
/* ------------------------------------------------------------------ */

export interface College {
  id: ID;
  slug: string;
  name: string;
  short_name: string;
  city: string;
  state: string;
  tier: CollegeTier;
  established: number;
  student_count: number;
  placement_rate: number;
  average_package_lpa: number;
  campusloop_students: number;
  accent: string;
  departments: string[];
}

/* ------------------------------------------------------------------ */
/* Profiles (students)                                                 */
/* ------------------------------------------------------------------ */

export interface Profile {
  id: ID;
  handle: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  college_id: ID;
  city: string;
  year_of_study: number;
  branch: string;
  section: string;
  bio: string;
  /** Canonical skill taxonomy slugs, see `src/lib/data/taxonomy.ts`. */
  skills: string[];
  interests: string[];
  seeking_skills: string[];
  /** Time-banking credits earned by teaching. 1 credit = 1 hour taught. */
  credits: number;
  /** Roommate / housing preferences. */
  budget_min: Rupee;
  budget_max: Rupee;
  sleep_schedule: SleepSchedule;
  cleanliness: 1 | 2 | 3 | 4 | 5;
  food: FoodPreference;
  smoking: SmokingPolicy;
  gender: GenderPreference;
  /** Weekday + weekend availability windows used by the matching engine. */
  available_slots: string[];
  rating: number;
  rating_count: number;
  verification: VerificationLevel;
  is_premium: boolean;
  joined_at: ISODate;
  response_time: string;
  transactions_count: number;
}

/* ------------------------------------------------------------------ */
/* 1. Books marketplace                                                */
/* ------------------------------------------------------------------ */

export type ListingKind = "sell" | "buy" | "rent";
export type BookCondition = "like_new" | "good" | "fair" | "heavy_notes";
export type ListingStatus = "available" | "reserved" | "sold";

export interface Listing {
  id: ID;
  title: string;
  author: string;
  edition: string;
  subject: string;
  semester: string;
  branch: string;
  kind: ListingKind;
  condition: BookCondition;
  price: Rupee;
  mrp: Rupee;
  negotiable: boolean;
  /** Rent-only: per-day charge. */
  rent_per_day?: Rupee;
  /** Rent-only: security deposit. */
  deposit?: Rupee;
  seller_id: ID;
  college_id: ID;
  status: ListingStatus;
  description: string;
  highlights: string[];
  tags: string[];
  /** 0-360 hue used to render a deterministic gradient thumbnail. */
  hue: number;
  emoji: string;
  created_at: ISODate;
  views: number;
  saves: number;
  /** Premium listings get a visibility multiplier in the ranking engine. */
  boosted: boolean;
}

/* ------------------------------------------------------------------ */
/* 2. Equipment rental                                                 */
/* ------------------------------------------------------------------ */

export type EquipmentCategory =
  | "laptops"
  | "calculators"
  | "lab_equipment"
  | "project_hardware"
  | "tools"
  | "audio_visual"
  | "sports";

export interface Equipment {
  id: ID;
  name: string;
  category: EquipmentCategory;
  brand: string;
  specs: string[];
  description: string;
  day_rate: Rupee;
  week_rate: Rupee;
  deposit: Rupee;
  owner_id: ID;
  college_id: ID;
  condition: string;
  /** Free-text availability, e.g. "Weekdays 6pm onwards". */
  availability: string;
  pickup_location: string;
  delivery_available: boolean;
  rating: number;
  rating_count: number;
  rentals_count: number;
  hue: number;
  emoji: string;
  created_at: ISODate;
}

/* ------------------------------------------------------------------ */
/* 3. PG / roommate finder                                             */
/* ------------------------------------------------------------------ */

export type PGType = "pg" | "shared_flat" | "room_in_flat" | "hostel_block";
export type FoodServed = "none" | "veg_only" | "veg_and_nonveg";

export interface PGListing {
  id: ID;
  title: string;
  type: PGType;
  rent: Rupee;
  deposit: Rupee;
  /** Inclusive of electricity & maintenance where stated. */
  bills_included: boolean;
  college_id: ID;
  locality: string;
  distance_km: number;
  walk_minutes_to_campus: number;
  gender: GenderPreference;
  room_type: string;
  beds_available: number;
  occupancy: number;
  food: FoodServed;
  amenities: string[];
  house_rules: string[];
  wifi_mbps: number;
  has_ac: boolean;
  attached_washroom: boolean;
  available_from: ISODate;
  owner_name: string;
  owner_contact: string;
  owner_is_alum: boolean;
  description: string;
  hue: number;
  emoji: string;
  photos_count: number;
  created_at: ISODate;
  /** Current viewer-relevant signals. */
  saves: number;
  enquiries: number;
  current_roommates: string[];
}

/* ------------------------------------------------------------------ */
/* 4. Project teammate finder                                          */
/* ------------------------------------------------------------------ */

export type ProjectType = "hackathon" | "startup" | "course_project" | "research" | "competition";
export type TeammateRole =
  | "frontend"
  | "backend"
  | "ml"
  | "data"
  | "design"
  | "product"
  | "hardware"
  | "pitch";

export interface TeammatePost {
  id: ID;
  title: string;
  project_type: ProjectType;
  event_name: string;
  hackathon_tier: "national" | "state" | "college" | "internal";
  description: string;
  owner_id: ID;
  college_id: ID;
  roles_needed: { role: TeammateRole; skills: string[]; count: number }[];
  filled_count: number;
  team_size_target: number;
  tech_stack: string[];
  timeline_weeks: number;
  hours_per_week: number;
  mode: "on_campus" | "hybrid" | "remote";
  prize_pool: Rupee;
  has_certificate: boolean;
  tags: string[];
  created_at: ISODate;
  applicants: number;
  views: number;
}

/* ------------------------------------------------------------------ */
/* 5. Skills exchange (time banking)                                   */
/* ------------------------------------------------------------------ */

export type SkillKind = "teach" | "learn";
export type SkillCategory =
  | "coding"
  | "data_science"
  | "design"
  | "academics"
  | "communication"
  | "hardware"
  | "business"
  | "music"
  | "sports"
  | "language";

export interface SkillProfile {
  id: ID;
  owner_id: ID;
  college_id: ID;
  title: string;
  kind: SkillKind;
  category: SkillCategory;
  level: 1 | 2 | 3 | 4 | 5;
  description: string;
  offering: string[];
  seeking: string[];
  /** Credits charged per hour of teaching. 1 credit = 1 hour. */
  credit_rate: number;
  duration_weeks: number;
  slots: string[];
  mode: "online" | "offline" | "either";
  rating: number;
  sessions_completed: number;
  verification: VerificationLevel;
  created_at: ISODate;
}

/* ------------------------------------------------------------------ */
/* 6. College events                                                   */
/* ------------------------------------------------------------------ */

export type EventCategory =
  | "tech"
  | "cultural"
  | "sports"
  | "workshop"
  | "placement"
  | "social"
  | "career";

export interface CampusEvent {
  id: ID;
  title: string;
  college_id: ID;
  club: string;
  category: EventCategory;
  description: string;
  /** ISO date-time. */
  starts_at: ISODate;
  ends_at: ISODate;
  venue: string;
  is_online: boolean;
  organizer: string;
  rsvp_count: number;
  capacity: number;
  price: Rupee;
  free: boolean;
  tags: string[];
  speakers: string[];
  featured: boolean;
  hue: number;
  emoji: string;
  /** Per-user interest signal, exposed so the UI can label strong fits. */
  relevance_hint: string;
}

/* ------------------------------------------------------------------ */
/* 7. Verified campus services                                         */
/* ------------------------------------------------------------------ */

export type ServiceCategory =
  | "electrician"
  | "plumber"
  | "laundry"
  | "printing"
  | "bike_repair"
  | "ac_service"
  | "pest_control"
  | "moving"
  | "tutoring"
  | "catering"
  | "electronics_repair";

export interface CampusService {
  id: ID;
  name: string;
  category: ServiceCategory;
  provider_name: string;
  provider_since: number;
  college_id: ID;
  rating: number;
  review_count: number;
  jobs_completed: number;
  base_price: Rupee;
  pricing_unit: "visit" | "kg" | "page" | "hour" | "item";
  turnaround_hours: number;
  verified: boolean;
  description: string;
  serviceable_areas: string[];
  guarantee: string;
  slots: string[];
  hue: number;
  emoji: string;
  premium_only: boolean;
}

export interface ServiceBooking {
  id: ID;
  service_id: ID;
  service_name: string;
  student_id: ID;
  student_name: string;
  date: string;
  slot: string;
  address: string;
  issue: string;
  status: "requested" | "confirmed" | "in_progress" | "completed" | "cancelled";
  price: Rupee;
  priority: "standard" | "premium_priority";
  created_at: ISODate;
}

/* ------------------------------------------------------------------ */
/* 8. Internships & opportunities                                      */
/* ------------------------------------------------------------------ */

export type OpportunityType = "internship" | "hackathon" | "scholarship" | "part_time" | "fellowship";
export type WorkMode = "onsite" | "hybrid" | "remote" | "online";
export type Eligibility = "all_branches" | "cgpa_8_plus" | "cgpa_7_plus" | "final_year" | "second_year_plus";

export interface Opportunity {
  id: ID;
  title: string;
  type: OpportunityType;
  company: string;
  company_initials: string;
  college_id: ID | null;
  city: string;
  mode: WorkMode;
  /** Monthly stipend for internships / monthly pay for part-time. */
  monthly_pay: Rupee;
  /** One-time award for scholarships, prize pool for hackathons. */
  award_value: Rupee;
  deadline: string;
  description: string;
  skills: string[];
  eligibility: Eligibility;
  min_cgpa: number | null;
  openings: number;
  posted_at: ISODate;
  sponsored: boolean;
  verified_company: boolean;
  applicants: number;
  tags: string[];
}

/* ------------------------------------------------------------------ */
/* 9. AI matching engine                                               */
/* ------------------------------------------------------------------ */

export type MatchDomain = "teammate" | "roommate" | "skills" | "items" | "services" | "events";

export type ScoreKey =
  /* shared */
  | "skill_complement"
  | "interest_overlap"
  | "availability"
  | "reputation"
  | "verification"
  | "value"
  /* teammate */
  | "commitment"
  | "college_proximity"
  /* roommate */
  | "budget_fit"
  | "distance"
  | "lifestyle"
  | "comfort"
  /* skills */
  | "direction_fit"
  | "credit_balance"
  | "level_gap"
  /* items */
  | "subject_fit"
  | "price_fit"
  | "interest_fit"
  | "seller_trust"
  /* services */
  | "need_fit"
  | "turnaround"
  | "coverage"
  /* events */
  | "category_fit"
  | "schedule_fit"
  | "capacity"
  | "cost"
  | "momentum";

export interface ScoreComponent {
  key: ScoreKey;
  label: string;
  /** Raw 0-1 signal before weighting. */
  raw: number;
  /** `raw` expressed on a 0-100 scale for display. */
  normalized: number;
  /** Share of the final score this component contributed, 0-1. */
  contribution: number;
  weight: number;
  detail: string;
}

export interface MatchResult<T = MatchTarget> {
  domain: MatchDomain;
  id: string;
  title: string;
  subtitle: string;
  score: number;
  headline: string;
  breakdown: ScoreComponent[];
  target: T;
}

export interface MatchTarget {
  id: ID;
  kind: MatchDomain;
  name: string;
  subtitle: string;
  href: string;
  emoji: string;
  hue: number;
  meta: string;
  price?: string;
}

export interface MatchPreferences {
  college_id: ID | "all";
  skills: string[];
  interests: string[];
  budget_min: Rupee;
  budget_max: Rupee;
  max_distance_km: number;
  sleep_schedule: SleepSchedule | "any";
  cleanliness: number;
  food: FoodPreference | "any";
  smoking: SmokingPolicy | "any";
  gender: GenderPreference;
  availability: string[];
  hours_per_week: number;
}

export interface MatchSummary {
  domain: MatchDomain;
  total_candidates: number;
  average_score: number;
  top_score: number;
  engine: string;
  computed_at: ISODate;
}

/* ------------------------------------------------------------------ */
/* Business model: transactions, subscriptions, sponsorships            */
/* ------------------------------------------------------------------ */

export type TransactionKind =
  | "marketplace_commission"
  | "rental_commission"
  | "service_booking"
  | "premium_subscription"
  | "college_saas"
  | "sponsorship"
  | "lead_gen";

export interface Transaction {
  id: ID;
  kind: TransactionKind;
  description: string;
  amount: Rupee;
  /** Platform take-home for this transaction. */
  platform_revenue: Rupee;
  payer: string;
  payee: string;
  college_id: ID | null;
  occurred_at: ISODate;
}

export interface CollegeSubscription {
  id: ID;
  college_id: ID;
  plan: "starter" | "campus" | "enterprise";
  mrr: Rupee;
  active_students: number;
  status: "active" | "trial" | "past_due";
  started_at: ISODate;
  renews_at: ISODate;
  features: string[];
}

export interface Sponsorship {
  id: ID;
  brand: string;
  brand_initials: string;
  college_id: ID;
  campaign: string;
  format: "sponsored_offer" | "campus_ambassador" | "banner_campaign" | "email_blast" | "lead_gen";
  budget: Rupee;
  impressions: number;
  clicks: number;
  ctr: number;
  status: "live" | "scheduled" | "ended";
  starts_at: ISODate;
  ends_at: ISODate;
}

export interface Notification {
  id: ID;
  profile_id: ID;
  title: string;
  body: string;
  kind: "match" | "booking" | "listing" | "opportunity" | "premium";
  read: boolean;
  created_at: ISODate;
}

/* ------------------------------------------------------------------ */
/* Pricing / marketing copy (single source for the UI)                 */
/* ------------------------------------------------------------------ */

export interface PlanFeature {
  label: string;
  free: string | boolean;
  premium: string | boolean;
  premium_only?: boolean;
}

export interface PricingPlan {
  id: "free" | "premium";
  name: string;
  price_monthly: Rupee;
  price_note: string;
  tagline: string;
  features: PlanFeature[];
  cta: string;
  highlighted: boolean;
}
