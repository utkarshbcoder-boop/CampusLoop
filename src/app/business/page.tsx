import type { Metadata } from "next";
import Link from "next/link";
import { Callout, PageHeader, Section, Stat, TagList } from "@/components/ui";
import { AwardIcon, BuildingIcon, ChartIcon, MegaphoneIcon, RepeatIcon, RupeeIcon, SparkIcon } from "@/components/Icon";
import { formatDate, rupees, rupeesShort, titleCase } from "@/lib/format";
import {
  collegeSubscriptions,
  platformStats,
  pricingPlans,
  sponsorships,
  transactions,
} from "@/lib/data/business";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Business Model",
  description:
    "Four revenue lines — student Premium, seller commission, college SaaS and brand sponsorship — with the unit economics and the arithmetic behind each one.",
};

const KIND_LABELS: Record<string, string> = {
  marketplace_commission: "Marketplace commission",
  rental_commission: "Rental commission",
  service_booking: "Service booking fee",
  premium_subscription: "Premium subscription",
  college_saas: "College SaaS",
  sponsorship: "Brand sponsorship",
  lead_gen: "Lead generation",
};

export default async function BusinessPage() {
  const premiumRevenue = transactions
    .filter((t) => t.kind === "premium_subscription")
    .reduce((a, t) => a + t.platform_revenue, 0);
  const commissionRevenue = transactions
    .filter((t) => t.kind === "marketplace_commission" || t.kind === "rental_commission")
    .reduce((a, t) => a + t.platform_revenue, 0);
  const serviceRevenue = transactions.filter((t) => t.kind === "service_booking").reduce((a, t) => a + t.platform_revenue, 0);
  const saasRevenue = transactions.filter((t) => t.kind === "college_saas").reduce((a, t) => a + t.platform_revenue, 0);
  const sponsorRevenue = transactions.filter((t) => t.kind === "sponsorship").reduce((a, t) => a + t.platform_revenue, 0);
  const leadGenRevenue = transactions.filter((t) => t.kind === "lead_gen").reduce((a, t) => a + t.platform_revenue, 0);

  const totalRevenue = transactions.reduce((a, t) => a + t.platform_revenue, 0);
  const totalVolume = transactions.reduce((a, t) => a + t.amount, 0);

  const lines = [
    { name: "Student Premium", icon: SparkIcon, revenue: premiumRevenue, share: 0 },
    { name: "Seller & rental commission", icon: RepeatIcon, revenue: commissionRevenue, share: 0 },
    { name: "College SaaS", icon: BuildingIcon, revenue: saasRevenue, share: 0 },
    { name: "Brand sponsorship", icon: MegaphoneIcon, revenue: sponsorRevenue, share: 0 },
    { name: "Service booking fees", icon: RupeeIcon, revenue: serviceRevenue, share: 0 },
    { name: "Employer lead generation", icon: ChartIcon, revenue: leadGenRevenue, share: 0 },
  ].map((l) => ({ ...l, share: totalRevenue ? (l.revenue / totalRevenue) * 100 : 0 }));
  lines.sort((a, b) => b.revenue - a.revenue);

  const maxLine = lines[0]?.revenue ?? 1;

  const avgOrder = platformStats.marketplace_gmv_monthly / Math.max(1, platformStats.bookings_completed);

  return (
    <>
      <PageHeader
        eyebrow="Revenue model"
        title="Four ways to make money, only one of them from charging students"
        description="CampusLoop does not gate the core experience. Students join free, list free and search free. Revenue comes from the transaction side, the institutions, and the brands — which is why the free tier can be genuinely free."
      >
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{rupeesShort(totalRevenue)}</p>
          <p className="text-[11px] text-white/45">platform revenue, seeded</p>
        </div>
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{rupeesShort(totalVolume)}</p>
          <p className="text-[11px] text-white/45">gross volume moved</p>
        </div>
      </PageHeader>

      <Section className="pt-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            value={platformStats.students_onboarded.toLocaleString("en-IN")}
            label="Students onboarded"
            sublabel="Free tier, all of them"
            icon={<AwardIcon width={20} height={20} />}
          />
          <Stat
            value={`${platformStats.premium_conversion_pct}%`}
            label="Premium conversion"
            sublabel="Free → ₹49/month, our modelled assumption"
            tone="flare"
            icon={<SparkIcon width={20} height={20} />}
          />
          <Stat
            value={rupeesShort(platformStats.marketplace_gmv_monthly)}
            label="Marketplace GMV / month"
            sublabel={`${rupees(avgOrder)} average order value`}
            tone="mint"
            icon={<ChartIcon width={20} height={20} />}
          />
          <Stat
            value={`${platformStats.avg_match_time_hours}h`}
            label="Median time to a match"
            sublabel="Down from weeks of group-chat searching"
            tone="flare"
            icon={<RepeatIcon width={20} height={20} />}
          />
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="cl-panel cl-panel-solid p-5 sm:p-6">
            <h2 className="text-lg font-bold text-white">Revenue mix</h2>
            <p className="mt-1.5 text-xs text-white/45">Share of platform revenue across the seeded transaction ledger.</p>
            <div className="mt-6 flex flex-col gap-4">
              {lines.map((l) => (
                <div key={l.name}>
                  <div className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="flex items-center gap-2 text-white/70">
                      <l.icon width={14} height={14} className="text-white/40" />
                      {l.name}
                    </span>
                    <span className="font-semibold text-white">
                      {rupeesShort(l.revenue)}{" "}
                      <span className="font-normal text-white/35">({l.share.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 via-purple-400 to-flare-400"
                      style={{ width: `${maxLine ? (l.revenue / maxLine) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="cl-panel p-5">
              <h3 className="text-base font-semibold text-white">1 · Students — free, then ₹49–99/month</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                The base is free forever. Premium removes caps: boosted listings, unlimited matches, priority service slots,
                AI skill insights. At {platformStats.premium_conversion_pct}% of{" "}
                {platformStats.students_onboarded.toLocaleString("en-IN")} students, that is roughly{" "}
                {Math.round((platformStats.students_onboarded * platformStats.premium_conversion_pct) / 100).toLocaleString("en-IN")}{" "}
                paying students, or about{" "}
                {rupeesShort(
                  ((platformStats.students_onboarded * platformStats.premium_conversion_pct) / 100) * 79 * 12,
                )}{" "}
                annualised recurring revenue at ₹79 average ARPU.
              </p>
              <Link href="/premium" className="cl-btn cl-btn-ghost mt-4">
                What Premium unlocks
              </Link>
            </div>

            <div className="cl-panel p-5">
              <h3 className="text-base font-semibold text-white">2 · Sellers & providers — small commission</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                A flat 8% on marketplace and rental transactions, charged to the seller. Services run at roughly 8% per
                booking, again from the provider. The student price never changes — the fee comes out of what the seller
                already quoted. At {rupeesShort(platformStats.marketplace_gmv_monthly)} GMV a month, an 8% take is{" "}
                {rupeesShort(platformStats.marketplace_gmv_monthly * 0.08)} before SaaS.
              </p>
            </div>

            <div className="cl-panel p-5" id="college">
              <h3 className="text-base font-semibold text-white">3 · Colleges — SaaS subscription</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                ₹25,000 per campus per month on the Campus plan, covering the engagement dashboard, event and placement
                publishing, vendor verification and roommate matching for incoming batches.{" "}
                {collegeSubscriptions.length} campuses are subscribed in the seed data for{" "}
                {rupeesShort(collegeSubscriptions.reduce((a, s) => a + s.mrr, 0))} MRR.
              </p>
              <Link href="/college" className="cl-btn cl-btn-ghost mt-4">
                College plans
              </Link>
            </div>

            <div className="cl-panel p-5">
              <h3 className="text-base font-semibold text-white">4 · Brands — sponsored offers & campus campaigns</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                A brand can target one college, one branch or one year. Formats: sponsored offers inside the marketplace,
                campus ambassador programmes, banner campaigns and email blasts. {sponsorships.length} campaigns are seeded,
                {sponsorships.filter((s) => s.status === "live").length} live right now, at an average CTR of{" "}
                {(
                  (sponsorships.filter((s) => s.status === "live").reduce((a, s) => a + s.ctr, 0) /
                    Math.max(1, sponsorships.filter((s) => s.status === "live").length)) *
                  100
                ).toFixed(1)}
                %. Sponsored listings are labelled, and never allowed inside a score breakdown.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Transaction ledger</h2>
          <p className="mt-2 text-sm text-white/50">
            {transactions.length} seeded entries. This is the table an investor will ask about first.
          </p>
          <div className="mt-6 overflow-x-auto">
            <div className="cl-panel overflow-hidden">
              <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/8 text-[10px] tracking-wider text-white/35 uppercase">
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Description</th>
                    <th className="px-4 py-3 font-semibold">Payer → Payee</th>
                    <th className="px-4 py-3 text-right font-semibold">Volume</th>
                    <th className="px-4 py-3 text-right font-semibold">To CampusLoop</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3">
                        <span className="cl-chip cl-chip-brand">{KIND_LABELS[t.kind] ?? titleCase(t.kind)}</span>
                      </td>
                      <td className="px-4 py-3 text-white/70">
                        {t.description}
                        <span className="mt-0.5 block text-xs text-white/35">{formatDate(t.occurred_at)}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/50">
                        {t.payer} → {t.payee}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-white/80">{rupees(t.amount)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-mint-400">
                        {rupees(t.platform_revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/10">
                    <td className="px-4 py-3 text-xs font-semibold text-white/50" colSpan={3}>
                      Total
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-white">{rupees(totalVolume)}</td>
                    <td className="px-4 py-3 text-right font-bold text-mint-400">{rupees(totalRevenue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Pricing</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {pricingPlans.map((p) => (
              <div
                key={p.id}
                className={`cl-panel p-5 ${p.highlighted ? "cl-panel-solid border-brand-400/40" : ""}`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-base font-semibold text-white">{p.name}</h3>
                  <p className="text-lg font-black text-white">{rupees(p.price_monthly)}</p>
                </div>
                <p className="mt-1 text-xs text-white/40">{p.price_note}</p>
                <p className="mt-3 text-sm text-white/60">{p.tagline}</p>
                <div className="mt-4">
                  <TagList tags={p.features.map((f) => (typeof f === "string" ? f : f.label))} max={6} tone="plain" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <Callout title="Why commission, not ads, is the core" tone="brand">
            Ads scale but they poison the ranking. Commission scales with student benefit — we only earn when a transaction
            actually helps someone. The two premium surfaces that do affect ranking (boosted listings, priority slots) are
            clearly marked and only available to paying students, never to advertisers.
          </Callout>
          <Callout title="Honest weakness" tone="flare">
            Commission is thin and a 2.5% take-rate marketplace needs volume. Our answer is that CampusLoop is not really a
            marketplace — it is the campus OS, and marketplace GMV is a by-product of daily use. If we ever become only a
            marketplace, the commission alone will not carry the business.
          </Callout>
        </div>
      </Section>
    </>
  );
}