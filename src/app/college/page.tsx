import type { Metadata } from "next";
import { Callout, PageHeader, Section, TagList } from "@/components/ui";
import { BuildingIcon } from "@/components/Icon";
import { rupeesShort, titleCase, formatDate } from "@/lib/format";
import { collegeSubscriptions } from "@/lib/data/business";
import { getColleges } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "CampusLoop for Colleges",
  description:
    "A simple dashboard showing college subscription data for the remaining modules: books & devices, and PG/roommate listings.",
};

const PLANS = [
  {
    name: "Starter",
    price: "₹0",
    period: "free forever",
    blurb: "Get started with CampusLoop on your campus - no cost, no commitment.",
    features: [
      "Books & device marketplace",
      "PG & roommate listings",
      "Basic analytics dashboard",
    ],
  },
  {
    name: "Campus",
    price: "₹25,000",
    period: "per month, per campus",
    blurb: "The standard plan for most colleges adopting CampusLoop.",
    features: [
      "Everything in Starter",
      "Official CampusLoop badge for your campus",
      "Priority support",
      "Custom onboarding",
    ],
    featured: true,
  },
];

export default async function CollegePage() {
  const colleges = await getColleges();
  const saasRevenue = collegeSubscriptions
    .filter((s) => s.status === "active")
    .reduce((a, s) => a + s.mrr, 0);
  const studentsOnSaas = collegeSubscriptions.reduce((a, s) => a + s.active_students, 0);

  return (
    <>
      <PageHeader
        eyebrow="CampusLoop B2B"
        title="CampusLoop for College Administrations"
        description="Simple subscription management for colleges using CampusLoop's core modules: books & device marketplace, and PG/roommate finder."
      >
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{rupeesShort(saasRevenue)}</p>
          <p className="text-[11px] text-white/45">SaaS MRR, seeded</p>
        </div>
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{collegeSubscriptions.length}</p>
          <p className="text-[11px] text-white/45">Colleges subscribed</p>
        </div>
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{studentsOnSaas.toLocaleString(
            "en-IN"
          )}</p>
          <p className="text-[11px] text-white/45">Students on SaaS</p>
        </div>
      </PageHeader>

      <Section className="pt-6">
        <h2 className="mb-4 text-xl font-semibold text-white">College Plans</h2>
        <div className="grid gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`cl-panel cl-panel-solid p-6 ${
                plan.featured ? "ring-2 ring-brand-400/50" : ""
              }`}
            >
              <h3 className="mb-2 text-lg font-semibold text-white">{plan.name}</h3>
              <p className="mb-1 text-[12px] text-white/60">{plan.price}/{plan.period}</p>
              <p className="mb-3 text-[11px] text-white/50">{plan.blurb}</p>
              <ul className="space-y-1 text-[10px] text-white/45">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <span className="mr-2" aria-hidden>•</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section className="pt-6">
        <h2 className="mb-4 text-xl font-semibold text-white">Current Subscriptions</h2>
        <div className="space-y-4">
          {collegeSubscriptions
            .filter((sub) => sub.status !== "past_due")
            .map((sub) => {
              const college = colleges.find((c) => c.id === sub.college_id);
              return (
                <div
                  key={sub.id}
                  className="rounded-xl border border-white/8 bg-white/3 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      {college?.name ?? sub.college_id}
                    </p>
                    <span
                      className={
                        sub.status === "active"
                          ? "cl-chip cl-chip-mint"
                          : "cl-chip cl-chip-flare"
                      }
                    >
                      {titleCase(sub.status)} · {titleCase(sub.plan)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-white/45">
                    {sub.active_students.toLocaleString("en-IN")} active students ·
                    {rupeesShort(sub.mrr)} MRR ·
                    renews{" "}
                    {formatDate(sub.renews_at)}
                  </p>
                  <div className="mt-3">
                    <TagList tags={sub.features} max={3} tone="plain" />
                  </div>
                </div>
              );
            })}
        </div>
      </Section>

      <Section className="pt-6">
        <Callout
          title="What this dashboard shows"
          tone="mint"
          icon={<BuildingIcon width={18} height={18} />}
        >
          This admin view shows subscription data for colleges using CampusLoop&apos;s core modules:
          <br />
          <br />
          • <strong>Books & Device Marketplace</strong> - Buy/sell/rent textbooks and devices
          <br />
          • <strong>PG & Roommate Finder</strong> - Find housing and roommates near campus
          <br />
          <br />
          All other modules (events, teams, skills, services, opportunities) have been removed to
          maintain focus on the core student needs as requested.
        </Callout>
      </Section>

      <Section className="pt-6">
        <p className="text-[10px] font-semibold tracking-wider text-white/35 uppercase">
          Figures on this page are seeded demo data
        </p>
        <p className="mt-2 text-xs text-white/45">
          {collegeSubscriptions.length} sample subscriptions are loaded into the local data
          layer so the dashboard is never empty during a demo. Swap in Supabase and these become
          real rows.
        </p>
      </Section>
    </>
  );
}