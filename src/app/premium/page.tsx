import type { Metadata } from "next";
import Link from "next/link";
import { PremiumToggleButton } from "@/components/Actions";
import { Callout, PageHeader, Section, Stat } from "@/components/ui";
import { CheckIcon, CloseIcon, SparkIcon, StarIcon } from "@/components/Icon";

import { pricingPlans } from "@/lib/data/business";
import { PREMIUM_ADDS } from "@/lib/premium";

export const metadata: Metadata = {
  title: "CampusLoop Premium",
  description:
    "CampusLoop Premium adds boosted listings for room and PG rentals, second-hand devices and used books, plus seller benefits.",
};

const FREE_INCLUDES = [
  "Browse and list rooms and PG rentals",
  "Buy and sell second-hand devices",
  "Buy and sell used books",
  "Standard listing visibility",
  "Browse without Premium; saving favorites requires Premium",
];

export default function PremiumPage() {
  const premiumPlan = pricingPlans.find((p) => p.id === "premium");

  return (
    <>
      <PageHeader
        eyebrow="Revenue model · B2C"
        title="Campus rentals and second-hand finds, all in one place."
        description="Browse and list rooms and PG rentals, second-hand devices, and used books for free. Premium adds optional seller tools to help your listings stand out."
      >
        <PremiumToggleButton
          priceLabel={`₹${premiumPlan?.price_monthly ?? 99} / month · ${premiumPlan?.price_note ?? "semester pass available"}`}
        />
      </PageHeader>

      <Section className="pt-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat value="₹0" label="To join" sublabel="No card, no college email gate that locks people out" />
          <Stat
            value={`₹${premiumPlan?.price_monthly ?? 99}`}
            label="Premium, per month"
            sublabel={premiumPlan?.price_note ?? "Semester pass available"}
            tone="flare"
            icon={<StarIcon width={20} height={20} />}
          />
          <Stat value="8%" label="Commission" sublabel="Charged to the seller, never added to the buyer" tone="mint" />
          <Stat value="12%" label="Target attach rate" sublabel="Our planning assumption, not a measured figure" tone="flare" />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="cl-panel cl-panel-solid flex flex-col p-6">
            <h2 className="text-lg font-bold text-white">Free — forever</h2>
            <p className="mt-1.5 text-sm text-white/50">Browse and post marketplace listings without paying.</p>
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
                <span className="cl-chip cl-chip-flare">
                  ₹{premiumPlan?.price_monthly ?? 99}/month · {(premiumPlan?.price_note ?? "semester pass available").replace(/^or /, "")}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-white/50">
                {premiumPlan ? premiumPlan.tagline : "For the student who is actually hunting for a room."}
              </p>
              <p className="mt-5 text-4xl font-black tracking-tight text-white">₹{premiumPlan?.price_monthly ?? 99}</p>
              <p className="text-xs text-white/40">
                per month · {premiumPlan?.price_note ?? "semester pass available"}
              </p>

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
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Built for campus rentals and resale</h2>
          <p className="mt-2 text-sm text-white/50">
            Find or list a room or PG, pass on a used book, or sell a second-hand device. Core browsing and listing stay free.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/homes" className="cl-btn cl-btn-ghost">Browse rooms & PGs</Link>
            <Link href="/books" className="cl-btn cl-btn-ghost">Browse used books</Link>
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
              No hidden or misleading promoted listings
            </span>
            <br />
            <span className="mt-2 inline-flex items-center gap-1.5">
              <CloseIcon width={13} height={13} className="text-rose-400" />
              No charge to browse rooms, PGs, books, or devices
            </span>
            <br />
            <span className="mt-2 inline-flex items-center gap-1.5">
              <CloseIcon width={13} height={13} className="text-rose-400" />
              No commission on a sale made entirely off-platform
            </span>
          </Callout>
        </div>

      </Section>
    </>
  );
}
