# CampusLoop

**Everything Students Need, Within Their Campus.**

College life is fragmented across WhatsApp groups, Instagram pages and random websites. CampusLoop brings it all into one trusted student ecosystem.

```bash
npm install
npm run dev
```

Open http://localhost:3000. No API keys, no database setup, no `.env` — it runs on seeded in-memory data immediately.

---

## The nine modules

| # | Module | Route | What it does |
|---|--------|-------|--------------|
| 1 | 📚 Used books | `/books` | Buy / sell / rent textbooks from students on your campus |
| 2 | 💻 Equipment rental | `/equipment` | Rent laptops, calculators and lab gear by the day |
| 3 | 🏠 PG & roommate finder | `/pg` | Rooms matched on budget, commute and lifestyle |
| 4 | 🧑‍💻 Project teammates | `/teams` | Skill-based matching so the team actually ships |
| 5 | 🎯 Skills exchange | `/skills` | Time banking — teach what you know, pay in credits |
| 6 | 🎤 College events | `/events` | Fests, workshops, placement drives on one feed |
| 7 | 🛠️ Verified services | `/services` | ID-verified vendors, fixed prices, bookable slots |
| 8 | 💼 Opportunities | `/opportunities` | Internships, hackathons, scholarships, part-time |
| 9 | 🤖 AI matching | `/match-lab` | The scoring engine, live, with full breakdowns |

Supporting pages: `/business` (revenue model), `/college` (B2B SaaS), `/premium` (B2C), `/methodology` (how scoring works).

---

## Tech

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · Firebase / Supabase (optional)

```bash
npm run dev        # dev server
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run build      # production build
npm run verify     # lint + typecheck + build
```

---

## Architecture

The app reads through one interface, `DataProvider` (`src/lib/db/provider.ts`), with two implementations:

- **`src/lib/db/mock.ts`** — seeded in-memory data from `src/lib/data/*.ts`. This is the default. Zero config.
- **`src/lib/db/supabase.ts`** — real Postgres, selected automatically once `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.
- **`src/lib/firebase/firestore.ts`** — Firestore provider, selected when Firebase is enabled and seeded.

Book, second-hand device, and home listings require Firebase Authentication and Firestore. Before enabling them in a Firebase project, deploy the repository's `firestore.rules` with `firebase deploy --only firestore:rules`. Sellers can create their own listings and register buyer interest; only the admin account can edit or delete listings or mark second-hand items sold. The `/marketplace` page is the shared public feed; `/homes` shows community-submitted rooms alongside the demo homes.

Because every page goes through `src/lib/queries.ts`, swapping providers changes no page code. TypeScript types in `src/lib/types.ts` are snake_case to match the Postgres columns, so a row from either provider is structurally identical.

```
src/
├─ app/                     # 26 routes
├─ components/              # ui, cards, FilterBar, Actions, Icon
└─ lib/
   ├─ data/                 # seeded records (11 files)
   ├─ db/                   # provider interface + mock / supabase impls
   ├─ matching/             # engine, weights, signals, enrichment
   ├─ queries.ts            # all read helpers
   └─ types.ts              # shared domain model
```

---

## The matching engine

Not a mock and not a black box. `src/lib/matching/engine.ts` is deterministic TypeScript with **no API key and no network calls**:

```
score = round( 100 × Σ ( wᵢ × sᵢ ) )
```

Six primitives in `signals.ts` — `coverage`, `jaccard`, `intervalFit`, `distanceDecay`, `slotOverlap`, `trust` — are weighted differently per domain (teammate, roommate, skills, items, services, events). Every result carries its full breakdown, so a 92 shows you that 41 of those points came from skill fit and 3 from campus proximity.

**Reproducible** (no randomness, no clock tie-breaks) · **Explainable** (itemised on every card) · **Free to run** (pure server-side, which is why the free tier can include unlimited matching).

`enrichment.ts` adds optional LLM-written reasoning when an OpenAI key is present — but it never touches the score, because a model-generated number can't be reproduced or defended to a user.

Full breakdown with live numbers: `/methodology`.

---

## Revenue model

| Line | Price | Payer |
|------|-------|-------|
| Student Premium | ₹49–99/month | Student, optional |
| Marketplace / rental commission | flat 8% | Seller or renter |
| Service booking fee | ~8% per booking | Provider |
| College SaaS | ₹25,000/month per campus | College |
| Brand sponsorship | per campaign | Brand |

Students join, list, sell and search **free, forever**. Premium removes caps: boosted listings, unlimited matches, priority service slots, AI skill insights. Commission is charged to the seller and never added to the buyer's price.

Worked numbers and the full transaction ledger: `/business`.

---

## Switching to real Supabase

1. Create a project, run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor.
2. Copy `.env.example` to `.env.local` and fill in your project URL and anon key.
3. Seed it — or import the TypeScript seed files in `src/lib/data/`, which export plain arrays.

`src/lib/db/index.ts` switches providers automatically. No page changes needed.

`schema.sql` includes RLS policies and three views: `platform_revenue_by_kind`, `college_engagement`, `eligible_opportunities`. The write policies are deliberately commented out for the prototype — the correct production rules are in the comments. **Tighten them before deploying anywhere real.**

---

## Pitch script (90 seconds)

> College life is fragmented. The used books are on an Instagram page. The room is on a WhatsApp group from 2022. The project teammate is someone your roommate's cousin knows. The plumber is a number three juniors forwarded to you. There is no app for college life — there are eleven group chats.
>
> **CampusLoop puts all nine of those in one place, for one login, on your campus.**
>
> Here's the part that matters — most apps in this space have a search bar and call it matching. Ours doesn't. [Open `/match-lab`] Every result is a weighted sum of named signals, and we show the student exactly why. Same profile, same score, every time. It runs on pure TypeScript, which means matching is free at scale — and that's how our free tier stays actually free.
>
> [Switch profiles in the header.] That's the whole product in thirty seconds: change who you are, and the room, the teammate, the book and the internship all re-rank.
>
> Students are free. Premium at forty-nine rupees removes the caps. We take eight percent from sellers. Colleges pay twenty-five thousand a month for the engagement dashboard they'd otherwise never be able to build. Brands buy campaigns on a feed students actually open.

---

## Honest limitations

- Seeded data. All figures are demo numbers, labelled as such in the UI.
- College write policies are intentionally permissive for the prototype.
- Cold start: a new student with no history scores low until they complete a profile.
- Reputation compounds — a single popular senior dominates roommate and teammate pools.
- No auth flow yet; the header switches between seeded demo users.
