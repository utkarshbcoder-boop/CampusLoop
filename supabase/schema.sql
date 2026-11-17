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
-- Row Level Security
-- ---------------------------------------------------------------------
-- Production posture: reads are public for the seeded catalogue; ALL writes
-- are DENIED by default (RLS default-deny) because no insert/update/delete
-- policies exist below. Before enabling this provider with real data:
--   * tighten the profiles select policy — it currently exposes email/phone
--     to anyone holding the anon key (column-level masking or Supabase Auth
--     policies required);
--   * add owner-scoped write policies (examples are commented out).
-- Never describe this file as "anon-writable" — it is not.

alter table colleges    enable row level security;
alter table profiles    enable row level security;
alter table listings    enable row level security;
alter table pg_listings enable row level security;

create policy "colleges are public"  on colleges for select using (true);
create policy "profiles are public"  on profiles for select using (true);
create policy "listings are public"  on listings for select using (true);
create policy "rooms are public"     on pg_listings for select using (true);

-- NOTE: the profiles policy above exposes every column, including email and
-- phone, to the anon role. Restrict it (or mask those columns) before this
-- provider is used with real user data.

-- Production: a student may only edit their own profile.
-- create policy "own profile only" on profiles for update using (auth.uid() = id);

-- Production: books — anyone reads, but only the owner edits or deletes.
-- create policy "owner manages listings" on listings for all
--   using (auth.uid()::text = owner_id) with check (auth.uid()::text = owner_id);

-- ---------------------------------------------------------------------
-- Useful views
-- ---------------------------------------------------------------------

-- Engagement per college, for the /college admin dashboard.
-- security_invoker: the view runs with the caller's RLS privileges instead
-- of the view owner's, so it cannot bypass row-level security.
create or replace view college_engagement
with (security_invoker = true) as
select
  c.id,
  c.name,
  c.short_name,
  (select count(*) from profiles p where p.college_id = c.id)                as members,
  (select count(*) from listings l where l.college_id = c.id and l.status = 'available') as live_listings,
  (select count(*) from pg_listings r where r.college_id = c.id)             as room_listings
from colleges c
order by members desc;