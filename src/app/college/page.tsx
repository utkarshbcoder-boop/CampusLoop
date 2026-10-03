import type { Metadata } from "next";
import Link from "next/link";
import { Callout, PageHeader, Section, Stat, TagList } from "@/components/ui";
import { BuildingIcon, ChartIcon, MegaphoneIcon, ShieldIcon } from "@/components/Icon";
import { rupeesShort, titleCase, formatDate } from "@/lib/format";
import { collegeSubscriptions, sponsorships, platformStats, transactions } from "@/lib/data/business";
import { getColleges } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "CampusLoop for Colleges",
  description:
    "A SaaS dashboard for college administrations: student engagement across the whole ecosystem, verified service vendors on campus, and a channel for brand campaigns that students actually read.",
};

const PLANS = [
  {
    name: "Starter",
    price: "₹0",
    period: "free forever",
    blurb: "Get the student engagement baseline. No card needed to see the problem you have.",
    features: [
      "Engagement dashboard for your campus",
      "Book, event and opportunity listings",
      "Verified service vendor directory",
      "Monthly engagement PDF",
    ],
  },
  {
    name: "Campus",
    price: "₹25,000",
    period: "per month, per campus",
    blurb: "The plan most colleges take. Turns the platform into an official channel.",
    features: [
      "Everything in Starter",
      "Official CampusLoop badge for your campus",
      "Placement drive and event publishing tools",
      "Hostel & mess vendor verification",
      "Roommate-matching onboarding for incoming batches",
      "Custom college domain and email login",
      "Priority onboarding support",
    ],
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "multi-campus groups",
    blurb: "For university groups running several campuses under one brand.",
    features: [
      "Everything in Campus",
      "Multi-campus rollups and benchmarking",
      "Brand campaign marketplace access",
      "API access to engagement data",
      "Dedicated success manager",
      "Custom onboarding for affiliated colleges",
    ],
  },
];

export default async function CollegePage() {
  const colleges = await getColleges();
  const saasRevenue = collegeSubscriptions
    .filter((s) => s.status === "active")
    .reduce((a, s) => a + s.mrr, 0);
  const studentsOnSaas = collegeSubscriptions.reduce((a, s) => a + s.active_students, 0);
  const liveSponsorships = sponsorships.filter((s) => s.status === "live");
  const sponsorBudget = liveSponsorships.reduce((a, s) => a + s.budget, 0);
  const avgCtr = liveSponsorships.length
    ? liveSponsorships.reduce((a, s) => a + s.ctr, 0) / liveSponsorships.length
    : 0;

  return (
    <>
      <PageHeader
        eyebrow="Revenue model · B2B SaaS"
        title="Give your college one app instead of nine WhatsApp groups"
        description="Every campus already runs a placement cell, a hostel office, a fest committee, a mess contractor and a career club. CampusLoop is the layer that connects them — and the dashboard your administration actually gets back."
      >
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{rupeesShort(saasRevenue)}</p>
          <p className="text-[11px] text-white/45">SaaS MRR, seeded</p>
        </div>
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{collegeSubscriptions.length}</p>
          <p className="text-[11px] text-white/45">campuses subscribed</p>
        </div>
      </PageHeader>

      <Section className="pt-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            value={studentsOnSaas.toLocaleString("en-IN")}
            label="Students on a paid campus"
            sublabel="Across all subscribed campuses"
            icon={<BuildingIcon width={20} height={20} />}
          />
          <Stat
            value={`${platformStats.colleges}`}
            label="Campuses live"
            sublabel="Free tier included, no onboarding call needed"
            tone="mint"
            icon={<ShieldIcon width={20} height={20} />}
          />
          <Stat
            value={`${(avgCtr * 100).toFixed(1)}%`}
            label="Average campaign CTR"
            sublabel="Across live brand campaigns"
            tone="flare"
            icon={<MegaphoneIcon width={20} height={20} />}
          />
          <Stat
            value={rupeesShort(sponsorBudget)}
            label="Live brand budget"
            sublabel="Sponsored campaigns running right now"
            tone="rose"
            icon={<ChartIcon width={20} height={20} />}
          />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`cl-panel flex flex-col p-6 ${p.featured ? "cl-panel-solid border-brand-400/40" : ""}`}
            >
              {p.featured ? (
                <span className="cl-chip cl-chip-brand mb-3 self-start">Most colleges</span>
              ) : null}
              <h2 className="text-lg font-bold text-white">{p.name}</h2>
              <p className="mt-4 text-3xl font-black tracking-tight text-white">{p.price}</p>
              <p className="mt-1 text-xs text-white/40">{p.period}</p>
              <p className="mt-4 text-sm leading-relaxed text-white/55">{p.blurb}</p>
              <ul className="mt-5 flex flex-col gap-2.5">
                {p.features.map((f) => (
                  <li key={f} className="text-xs leading-relaxed text-white/65">
                    — {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/business#college"
                className={`mt-6 ${p.featured ? "cl-btn cl-btn-primary" : "cl-btn cl-btn-ghost"}`}
              >
                {p.featured ? "Talk to us" : "Start free"}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="cl-panel cl-panel-solid p-5 sm:p-6">
            <h2 className="text-lg font-bold text-white">What the administration actually gets</h2>
            <div className="mt-5 flex flex-col gap-4">
              {[
                {
                  t: "One engagement number, not eleven",
                  b: "How many students actually used the campus ecosystem this month, split by module. Today that number is unmeasurable because activity lives in group chats.",
                },
                {
                  t: "Verified vendors for hostel and mess",
                  b: "Electricians, cooks and plumbers with ID checks and public ratings. Colleges lose real money to unverified contractors every year.",
                },
                {
                  t: "A channel brands cannot buy elsewhere",
                  b: "Students do not read a poster wall. They do read a feed their classmates posted into, which is why brand campaigns here get clicked at all.",
                },
                {
                  t: "Placement drive publishing",
                  b: "Post a drive once and it is visible to students who actually meet the CGPA cut-off, instead of forwarded into a group where it dies.",
                },
              ].map((x) => (
                <div key={x.t} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" aria-hidden />
                  <div>
                    <h3 className="text-sm font-semibold text-white">{x.t}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-white/55">{x.b}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="cl-panel p-5 sm:p-6">
            <h2 className="text-lg font-bold text-white">Campuses subscribed</h2>
            <div className="mt-5 flex flex-col gap-3">
              {collegeSubscriptions.map((s) => {
                const college = colleges.find((c) => c.id === s.college_id);
                return (
                  <div key={s.id} className="rounded-xl border border-white/8 bg-white/3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{college?.name ?? s.college_id}</p>
                      <span
                        className={
                          s.status === "active"
                            ? "cl-chip cl-chip-mint"
                            : s.status === "trial"
                              ? "cl-chip cl-chip-flare"
                              : "cl-chip cl-chip-brand"
                        }
                      >
                        {titleCase(s.status)} · {titleCase(s.plan)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-white/45">
                      {s.active_students.toLocaleString("en-IN")} active students · {rupeesShort(s.mrr)} MRR · renews{" "}
                      {formatDate(s.renews_at)}
                    </p>
                    <div className="mt-3">
                      <TagList tags={s.features} max={4} tone="plain" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-10 cl-panel p-5">
          <h2 className="text-base font-semibold text-white">Where the college plan breaks even</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            A ₹25,000 monthly campus fee needs about {Math.ceil(25000 / (79 * 0.12)).toLocaleString("en-IN")} paying
            students at ₹79 average ARPU with a 12% attach rate. A 3,000-student campus with 6% Premium penetration clears
            that at roughly ₹14,200 MRR against the ₹25,000 fee — which is why campus pricing is set against Premium attach on
            that campus, not against the college&apos;s total strength.{" "}
            <Link href="/business" className="text-brand-300">
              See the full unit economics
            </Link>
            .
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Callout title="Onboarding in one afternoon" tone="mint" icon={<BuildingIcon width={18} height={18} />}>
            Create the campus, import your student roll from the existing ERP export, verify the hostel and mess vendors, and
            send one link to the placement cell. No custom integration needed to start — the API is Enterprise-only.
          </Callout>
          <Callout title="What we will not sell a college" tone="flare" icon={<ShieldIcon width={18} height={18} />}>
            Individual student behaviour profiles. Colleges get aggregate, module-level engagement. A student&apos;s roommate
            search history and their browsing are never visible to their administration, at any plan tier.
          </Callout>
        </div>

        <div className="mt-10 cl-panel p-5">
          <p className="text-[10px] font-semibold tracking-wider text-white/35 uppercase">
            Figures on this page are seeded demo data
          </p>
          <p className="mt-2 text-xs text-white/45">
            {transactions.length} sample transactions and {sponsorships.length} brand campaigns are loaded into the local data
            layer so the dashboard is never empty during a demo. Swap in Supabase and these become real rows.
          </p>
        </div>
      </Section>
    </>
  );
}