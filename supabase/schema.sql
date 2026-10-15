-- CampusLoop — Postgres schema for Supabase
-- ========================================
-- The app runs with zero configuration using the seeded local data layer in
-- `src/lib/db/mock.ts`. This file is the drop-in Postgres equivalent: the
-- TypeScript types in `src/lib/types.ts` are snake_case to match these
-- columns exactly, so a row from either provider is structurally identical.
--
-- To use it:
--   1. Create a Supabase project.
--   2. Run this file in the SQL editor.
--   3. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
--      `src/lib/db/index.ts` will then select the Supabase provider automatically.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------

create type verification_level as enum ('unverified', 'email', 'student_id', 'govt_id', 'premium');
create type listing_kind as enum ('sell', 'buy', 'rent');
create type book_condition as enum ('like_new', 'good', 'fair', 'heavy_notes');
create type listing_status as enum ('available', 'reserved', 'sold', 'withdrawn');
create type gender_preference as enum ('any', 'male', 'female', 'non_binary');
create type sleep_schedule as enum ('early_bird', 'night_owl', 'flexible');
create type food_preference as enum ('veg', 'non_veg', 'vegan', 'egg', 'any');
create type smoking_policy as enum ('smoker', 'non_smoker', 'any');
create type work_mode as enum ('onsite', 'hybrid', 'remote', 'online');
create type opportunity_type as enum ('internship', 'hackathon', 'scholarship', 'part_time', 'fellowship');
create type eligibility as enum ('all_branches', 'cgpa_8_plus', 'cgpa_7_plus', 'final_year', 'second_year_plus');
create type service_pricing_unit as enum ('visit', 'kg', 'page', 'hour', 'item');
create type booking_status as enum ('requested', 'confirmed', 'in_progress', 'completed', 'cancelled');
create type subscription_plan as enum ('free', 'premium');
create type college_plan as enum ('starter', 'campus', 'enterprise');
create type transaction_kind as enum (
  'marketplace_commission', 'rental_commission', 'service_booking',
  'premium_subscription', 'college_saas', 'sponsorship', 'lead_gen'
);
create type sponsorship_format as enum (
  'sponsored_offer', 'campus_ambassador', 'banner_campaign', 'email_blast', 'lead_gen'
);
create type campaign_status as enum ('live', 'scheduled', 'ended');

-- ---------------------------------------------------------------------
-- 1. Colleges + profiles
-- ---------------------------------------------------------------------

create table colleges (
  id                  text primary key,
  name                text not null,
  short_name          text not null,
  city                text not null,
  state               text not null,
  slug                text not null unique,
  logo_hue            int  not null default 240,
  established_year    int,
  campusloop_plan     college_plan not null default 'starter',
  campusloop_students int  not null default 0,
  created_at          timestamptz not null default now()
);

create table profiles (
  id               text primary key,
  handle           text not null unique,
  name             text not null,
  initials         text not null,
  email            text not null unique,
  phone            text,
  college_id       text not null references colleges(id) on delete cascade,
  city             text not null,
  year_of_study    int  not null,
  branch           text not null,
  section          text,
  bio              text not null default '',
  skills           text[] not null default '{}',
  interests        text[] not null default '{}',
  seeking_skills   text[] not null default '{}',
  credits          int  not null default 0,
  budget_min       int  not null default 0,
  budget_max       int  not null default 0,
  sleep_schedule   sleep_schedule not null default 'flexible',
  cleanliness      int  not null default 3 check (cleanliness between 1 and 5),
  food             food_preference not null default 'any',
  smoking          smoking_policy not null default 'any',
  gender           gender_preference not null default 'any',
  available_slots  text[] not null default '{}',
  rating           numeric(2,1) not null default 0,
  rating_count     int not null default 0,
  verification     verification_level not null default 'unverified',
  is_premium       boolean not null default false,
  subscription     subscription_plan not null default 'free',
  joined_at        timestamptz not null default now(),
  response_time    text not null default '',
  transactions_count int not null default 0
);

create index profiles_college_idx on profiles(college_id);
create index profiles_skills_idx  on profiles using gin(skills);

-- ---------------------------------------------------------------------
-- 2. Books marketplace (buy / sell / rent)
-- ---------------------------------------------------------------------

create table listings (
  id          text primary key,
  title       text not null,
  author      text not null,
  subject     text not null,
  semester    text,
  kind        listing_kind not null,
  condition   book_condition not null,
  price       int not null check (price >= 0),
  rent_per_day int check (rent_per_day is null or rent_per_day > 0),
  status      listing_status not null default 'available',
  college_id  text not null references colleges(id) on delete cascade,
  owner_id    text not null references profiles(id) on delete cascade,
  edition     text,
  description text not null default '',
  tags        text[] not null default '{}',
  views       int not null default 0,
  saves       int not null default 0,
  created_at  timestamptz not null default now()
);

create index listings_college_idx on listings(college_id, status);
create index listings_subject_idx on listings(subject);
create index listings_price_idx   on listings(price);

-- ---------------------------------------------------------------------
-- 4. PG / roommate listings
-- ---------------------------------------------------------------------

create table pg_listings (
  id              text primary key,
  title           text not null,
  type            text not null,
  gender          gender_preference not null default 'any',
  rent            int not null check (rent > 0),
  deposit         int not null default 0,
  distance_km     numeric(4,1) not null default 0,
  college_id      text not null references colleges(id) on delete cascade,
  owner_id        text not null references profiles(id) on delete cascade,
  roommates_wanted int not null default 1,
  beds_available  int not null default 1,
  food            food_preference not null default 'any',
  wifi            boolean not null default false,
  furnished       boolean not null default false,
  ac              boolean not null default false,
  description     text not null default '',
  rules           text[] not null default '{}',
  tags            text[] not null default '{}',
  rating          numeric(2,1) not null default 0,
  review_count    int not null default 0,
  saves           int not null default 0,
  hue             int not null default 220,
  emoji           text not null default '',
  created_at      timestamptz not null default now()
);

create index pg_college_idx on pg_listings(college_id);
create index pg_rent_idx    on pg_listings(rent);



-- ---------------------------------------------------------------------
-- 6. Skills exchange (time banking, 1 credit = 1 hour taught)
-- ---------------------------------------------------------------------

create table skill_profiles (
  id                 text primary key,
  title              text not null,
  kind               text not null check (kind in ('teaching', 'learning')),
  category           text not null,
  level              text not null,
  description        text not null default '',
  tags               text[] not null default '{}',
  credit_rate        int not null default 1,
  sessions_completed int not null default 0,
  rating             numeric(2,1) not null default 0,
  review_count       int not null default 0,
  college_id         text not null references colleges(id) on delete cascade,
  owner_id           text not null references profiles(id) on delete cascade,
  remote_ok          boolean not null default true,
  slots              text[] not null default '{}',
  hue                int not null default 220,
  emoji              text not null default '',
  created_at         timestamptz not null default now()
);

create index skills_college_idx on skill_profiles(college_id);

-- ---------------------------------------------------------------------
-- 7. Campus events
-- ---------------------------------------------------------------------

create table campus_events (
  id          text primary key,
  title       text not null,
  category    text not null,
  description text not null default '',
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  venue       text not null,
  college_id  text not null references colleges(id) on delete cascade,
  club        text not null default '',
  price       int not null default 0,
  free        boolean not null default true,
  capacity    int not null default 100,
  rsvp_count  int not null default 0,
  tags        text[] not null default '{}',
  hue         int not null default 220,
  emoji       text not null default '',
  created_at  timestamptz not null default now()
);

create index events_college_idx on campus_events(college_id, starts_at);

-- ---------------------------------------------------------------------
-- 8. Verified campus services
-- ---------------------------------------------------------------------

create table campus_services (
  id                text primary key,
  name              text not null,
  category          text not null,
  provider_name     text not null,
  provider_since    int not null default 2020,
  college_id        text not null references colleges(id) on delete cascade,
  rating            numeric(2,1) not null default 0,
  review_count      int not null default 0,
  jobs_completed    int not null default 0,
  base_price        int not null check (base_price > 0),
  pricing_unit      service_pricing_unit not null default 'visit',
  turnaround_hours  int not null default 24,
  verified          boolean not null default false,
  description       text not null default '',
  serviceable_areas text[] not null default '{}',
  guarantee         text not null default '',
  slots             text[] not null default '{}',
  premium_only      boolean not null default false,
  hue               int not null default 220,
  emoji             text not null default '',
  created_at        timestamptz not null default now()
);

create index services_college_idx on campus_services(college_id, category);

create table service_bookings (
  id           text primary key,
  service_id   text not null references campus_services(id) on delete cascade,
  service_name text not null,
  student_id   text not null references profiles(id) on delete cascade,
  student_name text not null,
  date         date not null,
  slot         text not null,
  address      text not null,
  issue        text not null default '',
  status       booking_status not null default 'requested',
  amount       int not null default 0,
  created_at   timestamptz not null default now()
);

create index bookings_student_idx on service_bookings(student_id, status);

-- ---------------------------------------------------------------------
-- 9. Internships, hackathons, scholarships, part-time work
-- ---------------------------------------------------------------------

create table opportunities (
  id               text primary key,
  title            text not null,
  type             opportunity_type not null,
  company          text not null,
  company_initials text not null default '',
  college_id       text references colleges(id) on delete set null,
  city             text not null default '',
  mode             work_mode not null default 'onsite',
  monthly_pay      int not null default 0,
  award_value      int not null default 0,
  deadline         date not null,
  description      text not null default '',
  skills           text[] not null default '{}',
  eligibility      eligibility not null default 'all_branches',
  min_cgpa         numeric(2,1),
  openings         int not null default 1,
  posted_at        timestamptz not null default now(),
  sponsored        boolean not null default false,
  verified_company boolean not null default false,
  applicants       int not null default 0,
  tags             text[] not null default '{}'
);

create index opps_type_idx     on opportunities(type, deadline);
create index opps_college_idx  on opportunities(college_id);

-- ---------------------------------------------------------------------
-- 10. Match ledger — persists scores so they can be audited later
-- ---------------------------------------------------------------------

create table matches (
  id           text primary key,
  domain       text not null check (domain in ('teammate', 'roommate', 'skills', 'items', 'services', 'events')),
  profile_id   text not null references profiles(id) on delete cascade,
  target_id    text not null,
  score        int not null check (score between 0 and 100),
  breakdown    jsonb not null default '[]'::jsonb,
  engine       text not null default 'campusloop-scorer-v1',
  computed_at  timestamptz not null default now()
);

create index matches_profile_idx on matches(profile_id, domain, score desc);

-- ---------------------------------------------------------------------
-- Business model: transactions, subscriptions, sponsorships
-- ---------------------------------------------------------------------

create table transactions (
  id               text primary key,
  kind             transaction_kind not null,
  description      text not null,
  amount           int not null,
  platform_revenue int not null,
  payer            text not null,
  payee            text not null,
  college_id       text references colleges(id) on delete set null,
  occurred_at      timestamptz not null default now()
);

create index transactions_kind_idx on transactions(kind, occurred_at desc);

create table college_subscriptions (
  id             text primary key,
  college_id     text not null references colleges(id) on delete cascade,
  plan           college_plan not null,
  mrr            int not null default 0,
  active_students int not null default 0,
  status         text not null default 'active' check (status in ('active', 'trial', 'past_due')),
  features       text[] not null default '{}',
  started_at     timestamptz not null default now(),
  renews_at      timestamptz not null
);

create table sponsorships (
  id             text primary key,
  brand          text not null,
  brand_initials text not null default '',
  college_id     text not null references colleges(id) on delete cascade,
  campaign       text not null,
  format         sponsorship_format not null,
  budget         int not null default 0,
  impressions    int not null default 0,
  clicks         int not null default 0,
  ctr            numeric(5,2) not null default 0,
  status         campaign_status not null default 'scheduled',
  starts_at      timestamptz not null,
  ends_at        timestamptz not null
);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
-- Demo posture: read access is public, writes are anon-permitted so the
-- prototype works without an auth flow. Tighten these before any real
-- deployment — every commented policy is the correct production rule.

alter table profiles enable row level security;
alter table listings enable row level security;
alter table equipment enable row level security;
alter table pg_listings enable row level security;
alter table teammate_posts enable row level security;
alter table skill_profiles enable row level security;
alter table campus_events enable row level security;
alter table campus_services enable row level security;
alter table opportunities enable row level security;

create policy "profiles are public"   on profiles for select using (true);
create policy "listings are public"   on listings for select using (true);
create policy "equipment is public"   on equipment for select using (true);
create policy "rooms are public"      on pg_listings for select using (true);
create policy "team posts are public" on teammate_posts for select using (true);
create policy "skills are public"     on skill_profiles for select using (true);
create policy "events are public"     on campus_events for select using (true);
create policy "services are public"   on campus_services for select using (true);
create policy "opportunities are public" on opportunities for select using (true);

-- Production: a student may only edit their own profile.
-- create policy "own profile only" on profiles for update using (auth.uid() = id);

-- Production: books — anyone reads, but only the owner edits or deletes.
-- create policy "owner manages listings" on listings for all
--   using (auth.uid()::text = owner_id) with check (auth.uid()::text = owner_id);

-- ---------------------------------------------------------------------
-- Useful views
-- ---------------------------------------------------------------------

-- Monthly platform revenue by line, for the /business dashboard.
create or replace view platform_revenue_by_kind as
select
  kind,
  date_trunc('month', occurred_at) as month,
  sum(amount)           as gross_volume,
  sum(platform_revenue) as platform_revenue,
  count(*)              as transactions
from transactions
group by kind, date_trunc('month', occurred_at)
order by month desc, platform_revenue desc;

-- Engagement per college, for the /college admin dashboard.
create or replace view college_engagement as
select
  c.id,
  c.name,
  c.short_name,
  (select count(*) from profiles p where p.college_id = c.id)                as members,
  (select count(*) from listings l where l.college_id = c.id and l.status = 'available') as live_listings,
  (select count(*) from equipment e where e.college_id = c.id)               as equipment_listings,
  (select count(*) from pg_listings r where r.college_id = c.id)             as room_listings,
  (select count(*) from teammate_posts t where t.college_id = c.id)          as team_posts,
  (select count(*) from skill_profiles s where s.college_id = c.id)          as skill_profiles,
  (select count(*) from campus_services sv where sv.college_id = c.id and sv.verified) as verified_services
from colleges c
order by members desc;

-- Opportunities a student is actually eligible for.
create or replace view eligible_opportunities as
select
  o.*,
  p.name as student_name,
  p.branch,
  p.year_of_study,
  (o.eligibility <> 'final_year' or p.year_of_study >= 4) as year_ok
from opportunities o
cross join profiles p
where p.college_id = o.college_id or o.college_id is null;