import type { Metadata } from "next";
import Link from "next/link";
import { PremiumToggleButton } from "@/components/Actions";
import { Callout, PageHeader, Section, Stat, TagList } from "@/components/ui";
import { CheckIcon, CloseIcon, SparkIcon, StarIcon } from "@/components/Icon";

import { pricingPlans } from "@/lib/data/business";
import { NAV_MODULES } from "@/lib/nav";

export const metadata: Metadata = {
  title: "CampusLoop Premium",
  description:
    "Free forever for the basics that matter. Premium at ₹49–99 a month adds boosted listings, unlimited roommate matches, priority service booking and AI skill insights.",
};

const FREE_INCLUDES = [
  "Unlimited marketplace listings — buy, sell and rent",
  "Up to 5 roommate matches a day",
  "Full event feed and RSVP",
  "Browse every verified campus service",
  "Browse all internships and opportunities",
  "Basic match scores",
];

const PREMIUM_ADDS = [
  {
    title: "Boosted listings",
    body: "Your book or gear appears at the top of its category for 7 days. On a campus with 400 students selling the same three textbooks, position is the whole game.",
    icon: "🚀",
  },
  {
    title: "Unlimited roommate & teammate matches",
    body: "The free tier caps you at 5 matches a day. If your hostel search has not worked by week three, the cap is the problem, not the algorithm.",
    icon: "🏠",
  },
  {
    title: "Priority service booking",
    body: "Emergency AC slots and same-day plumbing jump the queue. Providers see Premium requests first.",
    icon: "🛠️",
  },
  {
    title: "AI skill insights",
    body: "A read on which skills are actually in demand on your campus this placement season, and the two credits you should earn next to unlock the most openings.",
    icon: "🎯",
  },
  {
    title: "Fee-free selling",
    body: "Premium sellers pay zero commission on the first three sales every month. Students should not lose 8% of a ₹150 book sale.",
    icon: "💸",
  },
  {
    title: "Verified badge & priority support",
    body: "A trust badge on your profile, plus a support queue that answers within a day.",
    icon: "🛡️",
  },
];

export default function PremiumPage() {
  const premiumPlan = pricingPlans.find((p) => p.id === "premium");

  return (
    <>
      <PageHeader
        eyebrow="Revenue model · B2C"
        title="Free for the basics. Paid for the things that save you a semester."
        description="CampusLoop is free for every student to join, list, sell and discover. Premium exists for one reason: to remove the artificial limits that stop a motivated student from finding a room or selling a stack of books."
      >
        <PremiumToggleButton />
      </PageHeader>

      <Section className="pt-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat value="₹0" label="To join" sublabel="No card, no college email gate that locks people out" />
          <Stat value="₹49–99" label="Premium, per month" sublabel="Priced at roughly one pizza a month" tone="flare" icon={<StarIcon width={20} height={20} />} />
          <Stat value="8%" label="Commission" sublabel="Charged to the seller, never added to the buyer" tone="mint" />
          <Stat value="12%" label="Target attach rate" sublabel="Our planning assumption, not a measured figure" tone="flare" />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="cl-panel cl-panel-solid flex flex-col p-6">
            <h2 className="text-lg font-bold text-white">Free — forever</h2>
            <p className="mt-1.5 text-sm text-white/50">Everything a student needs to take part.</p>
            <p className="mt-5 text-4xl font-black tracking-tight text-white">₹0</p>
            <ul className="mt-6 flex flex-col gap-3">
              {FREE_INCLUDES.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-white/70">
                  <CheckIcon width={15} height={15} className="mt-0.5 shrink-0 text-mint-400" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/books" className="cl-btn cl-btn-ghost mt-7">
              Start without paying
            </Link>
          </div>

          <div className="cl-panel cl-panel-solid relative overflow-hidden border-brand-400/40 p-6">
            <div
              className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl"
              aria-hidden
            />
            <div className="relative">
              <div className="flex items-center gap-2">
                <SparkIcon width={18} height={18} className="text-flare-400" />
                <h2 className="text-lg font-bold text-white">Premium</h2>
                <span className="cl-chip cl-chip-flare">₹49 student · ₹99 power user</span>
              </div>
              <p className="mt-1.5 text-sm text-white/50">
                {premiumPlan ? premiumPlan.tagline : "For the student who is actually hunting for a room."}
              </p>
              <p className="mt-5 text-4xl font-black tracking-tight text-white">₹49</p>
              <p className="text-xs text-white/40">per month · cancel in two taps</p>

              <div className="mt-6 flex flex-col gap-4">
                {PREMIUM_ADDS.map((f) => (
                  <div key={f.title} className="flex gap-3">
                    <span className="text-lg" aria-hidden>
                      {f.icon}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-white/55">{f.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Premium across all nine modules</h2>
          <p className="mt-2 text-sm text-white/50">
            One subscription, one login, and every module knows you are a paying student.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {NAV_MODULES.map((m) => (
              <div key={m.href} className="cl-panel p-4">
                <div className="flex items-center gap-2">
                  <span aria-hidden>{m.emoji}</span>
                  <Link href={m.href} className="text-sm font-semibold text-white hover:text-brand-200">
                    {m.label}
                  </Link>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-white/50">{m.blurb}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <Callout title="Why we did not put ads in front of students" tone="brand">
            A student looking for a PG has about four seconds of patience. An ad in that slot costs more than the student is
            worth and destroys the only asset we have — being the place they trust. Sponsorship is sold to brands as{" "}
            <em>clearly labelled campaigns</em>{" "}
            <Link href="/business" className="text-brand-300">
              on the business page
            </Link>
            , never as disguised results.
          </Callout>
          <Callout title="What we will not do" tone="flare">
            <span className="inline-flex items-center gap-1.5">
              <CloseIcon width={13} height={13} className="text-rose-400" />
              No selling your data to recruiters without an explicit opt-in
            </span>
            <br />
            <span className="mt-2 inline-flex items-center gap-1.5">
              <CloseIcon width={13} height={13} className="text-rose-400" />
              No paid placement inside a score breakdown
            </span>
            <br />
            <span className="mt-2 inline-flex items-center gap-1.5">
              <CloseIcon width={13} height={13} className="text-rose-400" />
              No commission on a sale made entirely off-platform
            </span>
          </Callout>
        </div>

        <div className="mt-10 cl-panel p-5">
          <p className="text-xs font-medium tracking-wide text-white/40 uppercase">Skills on your profile today</p>
          <div className="mt-3">
            <TagList tags={["react", "typescript", "python", "sql", "figma"]} tone="brand" />
          </div>
          <p className="mt-3 text-xs text-white/45">
            Premium turns this list into a plan: which of these are priced highest on your campus right now, and what the
            skill exchange can teach you for one credit.{" "}
            <Link href="/match-lab?domain=skills" className="text-brand-300">
              See the skill match engine
            </Link>
            .
          </p>
        </div>
      </Section>
    </>
  );
}