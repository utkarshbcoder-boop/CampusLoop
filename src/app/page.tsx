import Link from "next/link";
import {
  ArrowRightIcon,
  AwardIcon,
  BoltIcon,
  BriefcaseIcon,
  BuildingIcon,
  ChartIcon,
  CheckIcon,
  MegaphoneIcon,
  ShieldIcon,
  SparkIcon,
  StarIcon,
  TargetIcon,
} from "@/components/Icon";
import { EquipmentCard, EventCard, ListingCard, ServiceCard, TeammateCard } from "@/components/cards";
import { GhostLink, PrimaryLink, Section, SectionHeading, Stat } from "@/components/ui";
import { platformStats } from "@/lib/data/business";
import { compactNumber, rupeesShort } from "@/lib/format";
import { NAV_MODULES } from "@/lib/nav";
import { getColleges, loadMatchContext } from "@/lib/queries";

export const revalidate = 3600;

/** Live counts so the landing page never drifts from the seeded dataset. */
async function moduleCounts() {
  const ctx = await loadMatchContext();
  return {
    ctx,
    books: ctx.listings.length,
    equipment: ctx.equipment.length,
    pg: ctx.pgListings.length,
    teams: ctx.teammatePosts.length,
    skills: ctx.skillProfiles.length,
    events: ctx.events.length,
    services: ctx.services.length,
    students: ctx.profiles.length,
  };
}

export default async function LandingPage() {
  const colleges = await getColleges();
  const { ctx, books, equipment, pg, teams, skills, events, services, students } = await moduleCounts();

  const counts: Record<string, number> = { books, equipment, pg, teams, skills, events, services };
  const painPoints = [
    {
      emoji: "📱",
      title: "Twelve WhatsApp groups",
      body: "Books, rooms, teams, fests, plumbers — each in a different group, most unread, none searchable.",
    },
    {
      emoji: "🕳️",
      title: "Fake listings everywhere",
      body: "OLX and Instagram pages have no student verification. You travel across campus for a book that does not exist.",
    },
    {
      emoji: "💸",
      title: "Paying new-price for old books",
      body: "The ₹900 book you need was sold for ₹180 four blocks away, but you will never see that listing.",
    },
    {
      emoji: "🎒",
      title: "Hardware you use twice",
      body: "A lab calculator for one semester, a camera for one trip. Nobody rents because nobody asks properly.",
    },
    {
      emoji: "🤷",
      title: "Teams that never ship",
      body: "Three people claim to do the backend, nobody does the design, and the demo is a slideshow.",
    },
    {
      emoji: "🛵",
      title: "Services with no accountability",
      body: "A 'carpenter' arrives three days later at three times the price. No ratings, no guarantee, no record.",
    },
  ];

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* Hero                                                          */}
      {/* ------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-white/8">
        <div className="cl-grid-bg pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[68rem] -translate-x-1/2 rounded-full opacity-45 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(99,102,241,0.35), rgba(217,70,239,0.12), transparent)" }}
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div>
            <div>
              <span className="cl-chip cl-chip-brand mb-5 inline-flex items-center gap-1.5">
                <span className="cl-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-mint-400" aria-hidden />
                {students} demo students · {colleges.length} campuses · live right now
              </span>

              <h1 className="text-4xl leading-[1.05] font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Everything students need,
                <span className="block bg-gradient-to-r from-brand-300 via-fuchsia-300 to-flare-300 bg-clip-text text-transparent">
                  within their campus.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
                Nine modules that usually need nine different apps: used books, equipment rental, PG and roommate matching,
                project teammates, a skills exchange, events, verified services and internships. One login, one campus, one
                trusted feed — ranked by a match engine that shows its working.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <PrimaryLink href="/books" className="px-5 py-3 text-sm">
                  <SparkIcon width={16} height={16} />
                  Browse the marketplace
                </PrimaryLink>
                <GhostLink href="/teams" className="px-5 py-3 text-sm">
                  Explore teammates
                  <ArrowRightIcon width={16} height={16} />
                </GhostLink>
              </div>

              <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                {[
                  { v: compactNumber(platformStats.students_onboarded), l: "Students onboarded" },
                  { v: `${platformStats.successful_matches.toLocaleString("en-IN")}`, l: "Successful matches" },
                  { v: `${platformStats.avg_match_time_hours}h`, l: "Median time to match" },
                  { v: `${platformStats.premium_conversion_pct}%`, l: "Premium conversion" },
                ].map((s) => (
                  <div key={s.l}>
                    <dt className="text-2xl font-bold tracking-tight text-white">{s.v}</dt>
                    <dd className="mt-0.5 text-[11px] tracking-wide text-white/45 uppercase">{s.l}</dd>
                  </div>
                ))}
              </dl>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* Problem                                                        */}
      {/* ------------------------------------------------------------- */}
      <Section>
        <SectionHeading
          eyebrow="The problem"
          title="College life is fragmented. CampusLoop is the loop."
          description="Every need a student has on campus is already being solved by somebody — badly, in WhatsApp groups, with no verification, no history and no search. We are not inventing demand. We are consolidating nine broken workflows behind one login."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {painPoints.map((p) => (
            <article key={p.title} className="cl-panel cl-panel-hover p-5">
              <span className="text-2xl" aria-hidden>
                {p.emoji}
              </span>
              <h3 className="mt-3 text-base font-semibold text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{p.body}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------------- */}
      {/* Nine modules                                                   */}
      {/* ------------------------------------------------------------- */}
      <Section id="modules" className="border-t border-white/8">
        <SectionHeading
          title="One login. Nine things you actually need."
          description="Every module is independently useful and compounding in value — the roommate you match here is in the same building as the equipment you rent, and they show up in your events feed."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {NAV_MODULES.map((m, i) => (
            <Link
              key={m.href}
              href={m.href}
              className="cl-panel cl-panel-hover group relative flex flex-col p-5 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/6 text-xl" aria-hidden>
                  {m.emoji}
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-white/25 uppercase">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-white group-hover:text-brand-200">{m.label}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-white/55">{m.blurb}</p>
              <p className="mt-3 text-xs leading-relaxed text-brand-300/90">“{m.hook}”</p>
              <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3 text-xs">
                <span className="text-white/40">{counts[m.href.slice(1)] ?? 0} live listings</span>
                <span className="flex items-center gap-1 font-medium text-white/70 transition group-hover:text-brand-200">
                  Open
                  <ArrowRightIcon width={14} height={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------------- */}
      {/* Real data preview                                              */}
      {/* ------------------------------------------------------------- */}
      <Section className="border-t border-white/8">
        <SectionHeading
          eyebrow="Real listings, right now"
          title="This is not a mockup. Every card below comes from the seeded data layer."
          description={`${books} books, ${equipment} pieces of equipment, ${teams} team posts, ${events} events and ${services} services are live in the database right now — with filters, sorting and detail pages wired to the same provider.`}
          action={
            <GhostLink href="/books" className="text-sm">
              Browse everything
              <ArrowRightIcon width={15} height={15} />
            </GhostLink>
          }
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <ListingCard listing={ctx.listings[0]} colleges={colleges} />
          <TeammateCard post={ctx.teammatePosts[0]} colleges={colleges} />
          <ServiceCard service={ctx.services[0]} colleges={colleges} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <EquipmentCard item={ctx.equipment[0]} colleges={colleges} owner={ctx.profiles[1]} />
          <EventCard event={[...ctx.events].sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0]} colleges={colleges} />
          <div className="cl-panel flex flex-col justify-between gap-4 p-5">
            <div>
              <span className="cl-chip cl-chip-flare">Marketplace health</span>
              <p className="mt-3 text-3xl font-black tracking-tight text-white">
                {rupeesShort(platformStats.marketplace_gmv_monthly)}
              </p>
              <p className="mt-1 text-xs text-white/45">monthly marketplace GMV across the network</p>
            </div>
            <ul className="flex flex-col gap-2 text-xs text-white/55">
              <li className="flex items-center gap-2">
                <CheckIcon width={14} height={14} className="text-mint-400" />
                {platformStats.bookings_completed.toLocaleString("en-IN")} service bookings completed
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon width={14} height={14} className="text-mint-400" />
                {platformStats.service_providers} verified providers on the network
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon width={14} height={14} className="text-mint-400" />
                Escrow-backed book and equipment trades
              </li>
            </ul>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------- */}
      {/* Trust                                                         */}
      {/* ------------------------------------------------------------- */}
      <Section className="border-t border-white/8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Trust"
              title="Verification is the whole moat."
              description="Any marketplace can list a used textbook. The hard part is knowing it exists, is in the condition claimed, and belongs to a real student on your campus. CampusLoop attacks that with a verification ladder, transaction escrow and public rating history that compounds per college."
              align="left"
            />
            <div className="flex flex-col gap-3">
              {[
                {
                  icon: <ShieldIcon width={18} height={18} />,
                  title: "Student-ID and college-email verification",
                  body: "College email verification is the strongest signal and is what unlocks Premium selling privileges.",
                },
                {
                  icon: <BoltIcon width={18} height={18} />,
                  title: "Escrow on every peer trade",
                  body: "Money is held until the handover is confirmed by both sides. No cash changing hands in a corridor.",
                },
                {
                  icon: <AwardIcon width={18} height={18} />,
                  title: "Ratings that cannot be deleted",
                  body: "Reputation feeds directly into the match score, so good behaviour compounds into better matches.",
                },
              ].map((item) => (
                <div key={item.title} className="cl-panel flex items-start gap-3 p-4">
                  <span className="mt-0.5 shrink-0 text-brand-300" aria-hidden>
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/55">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Stat
              value="4"
              label="Verification tiers"
              sublabel="Unverified → student ID → college email → Aadhaar"
              icon={<ShieldIcon width={20} height={20} />}
            />
            <Stat
              value="₹0"
              label="Cash exchanged on campus"
              sublabel="Escrow holds payment until both sides confirm the handover"
              icon={<TargetIcon width={20} height={20} />}
              tone="mint"
            />
            <Stat
              value={String(platformStats.successful_matches.toLocaleString("en-IN"))}
              label="Successful matches"
              sublabel="Roommates, teams and skill exchanges that actually happened"
              icon={<ChartIcon width={20} height={20} />}
              tone="flare"
            />
            <Stat
              value={`${platformStats.avg_match_time_hours}h`}
              label="Median match time"
              sublabel="From first login to a confirmed roommate or teammate"
              icon={<BoltIcon width={20} height={20} />}
            />
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------- */}
      {/* Business + campus network                                     */}
      {/* ------------------------------------------------------------- */}
      <Section className="border-t border-white/8">
        <SectionHeading
          eyebrow="How it makes money"
          title="Students pay ₹49. The campus pays more."
          description="Student Premium at ₹49–99 a month is the wedge, not the business. The revenue engine is marketplace commissions from sellers, college SaaS licences, and brand sponsorships sold into a captive, verified campus audience."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            {
              icon: <StarIcon width={20} height={20} />,
              title: "Student Premium · ₹49–99/mo",
              body: "Unlimited roommate matches, full score breakdowns, boosted listings and priority service booking. Around 6% of active students convert, and they churn slowly because the roommate and team matches keep paying off.",
              tone: "brand" as const,
            },
            {
              icon: <BuildingIcon width={20} height={20} />,
              title: "College SaaS · ₹1.5–4L/yr",
              body: "A white-labelled loop for the placement cell, club heads and hostel management — verified student directory, internal notices, event approvals and placement drives in one dashboard.",
              tone: "mint" as const,
            },
            {
              icon: <MegaphoneIcon width={20} height={20} />,
              title: "Sponsorships & brand reach",
              body: "EdTech, hardware and fintech brands sponsor fest pages and skill-exchange challenges, reaching a verified student audience that mainstream Indian media cannot buy at this precision.",
              tone: "flare" as const,
            },
          ].map((card) => (
            <div key={card.title} className="cl-panel flex flex-col p-5">
              <span className="text-brand-300" aria-hidden>
                {card.icon}
              </span>
              <h3 className="mt-3 text-base font-semibold text-white">{card.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-white/55">{card.body}</p>
              <Link href="/business" className="mt-4 flex items-center gap-1 text-xs font-medium text-brand-300">
                See the unit economics
                <ArrowRightIcon width={14} height={14} />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <div className="cl-divider mb-8" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-white">Live on {colleges.length} campuses</h3>
            <Link href="/college" className="text-sm text-brand-300 transition hover:text-brand-200">
              Bring CampusLoop to your college →
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {colleges.map((c) => (
              <Link key={c.id} href={`/college/${c.slug}`} className="cl-panel cl-panel-hover p-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/6 text-[11px] font-bold text-white">
                    {c.short_name.slice(0, 3).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{c.name}</p>
                    <p className="truncate text-[11px] text-white/40">
                      {c.city} · {c.state}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3 text-[11px] text-white/45">
                  <span className="flex items-center gap-1">
                    <BriefcaseIcon width={12} height={12} />
                    {c.placement_rate}% placements
                  </span>
                  <span>{c.campusloop_students.toLocaleString("en-IN")} students</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------- */}
      {/* Closing CTA                                                    */}
      {/* ------------------------------------------------------------- */}
      <Section className="border-t border-white/8">
        <div className="cl-panel cl-panel-solid relative overflow-hidden p-8 text-center sm:p-14">
          <div
            className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(closest-side, rgba(217,70,239,0.3), transparent)" }}
            aria-hidden
          />
          <div className="relative">
            <span className="cl-chip cl-chip-brand inline-flex">Built for one campus, then the next</span>
            <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl">
              Your hostel block already has everything CampusLoop shows. We just put it in one place.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
              Switch the demo profile from the header to see roommate, team and skill matches recompute for a different
              student — same engine, different inputs, different ranking. No API key, no database, no setup.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
               <PrimaryLink href="/books" className="px-5 py-3 text-sm">
                 Browse used books
               </PrimaryLink>
              <GhostLink href="/premium" className="px-5 py-3 text-sm">
                See Premium
              </GhostLink>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-white/35">
              <span className="flex items-center gap-1.5">
                <CheckIcon width={13} height={13} className="text-mint-400" /> Runs with zero configuration
              </span>
              <span className="flex items-center gap-1.5">
                <CheckIcon width={13} height={13} className="text-mint-400" /> Deterministic, explainable scoring
              </span>
              <span className="flex items-center gap-1.5">
                <CheckIcon width={13} height={13} className="text-mint-400" /> Swap in Supabase with one env var
              </span>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
