import Link from "next/link";
import { ArrowRightIcon } from "@/components/Icon";
import { Section, SectionHeading } from "@/components/ui";
import { getSecondhandListings } from "@/lib/queries";
import { HOMES } from "@/lib/data/homes";

export const revalidate = 3600;

export default async function LandingPage() {
  const listings = await getSecondhandListings();
  const roomCount = HOMES.length;

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/8">
        <div className="cl-grid-bg pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[68rem] -translate-x-1/2 rounded-full opacity-45 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(99,102,241,0.35), rgba(217,70,239,0.12), transparent)" }}
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <span className="cl-chip cl-chip-brand mb-5 inline-flex">
            A student marketplace for pre-owned items and nearby homes
          </span>
          <h1 className="max-w-4xl text-4xl leading-[1.05] font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Find second-hand items and a place to live.
            <span className="block bg-gradient-to-r from-brand-300 via-fuchsia-300 to-flare-300 bg-clip-text text-transparent">
              All in one campus marketplace.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
            Browse pre-owned books and devices, or find rooms, flats, and PGs to rent or buy. Have something to sell or
            rent out? Create a listing for students nearby.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/marketplace" className="cl-btn cl-btn-primary px-5 py-3 text-sm">
              Browse second-hand items <ArrowRightIcon width={16} height={16} />
            </Link>
            <Link href="/homes" className="cl-btn cl-btn-ghost px-5 py-3 text-sm">
              Find rooms, flats &amp; PGs <ArrowRightIcon width={16} height={16} />
            </Link>
          </div>
          <p className="mt-5 text-xs text-white/40">
          Confirm listing details and arrange payment directly with the lister before making a decision.
          </p>
        </div>
      </section>

      <Section>
        <SectionHeading
          eyebrow="Browse"
          title="What are you looking for?"
          description="A focused marketplace for second-hand things and places to live—nothing else."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/marketplace" className="cl-panel cl-panel-hover group p-6">
            <span className="text-3xl" aria-hidden>🛍️</span>
            <h2 className="mt-4 text-xl font-bold text-white group-hover:text-brand-200">Second-hand items</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              Browse used books, devices, and other pre-owned listings. Filter by item type, campus, and availability.
            </p>
            <p className="mt-5 text-xs text-white/40">{listings.length} listings to explore</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-300">
              Browse items <ArrowRightIcon width={14} height={14} />
            </span>
          </Link>
          <Link href="/homes" className="cl-panel cl-panel-hover group p-6">
            <span className="text-3xl" aria-hidden>🏠</span>
            <h2 className="mt-4 text-xl font-bold text-white group-hover:text-brand-200">Rooms, flats &amp; PGs</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              Find a PG, a separate room, or a flat for rent or sale near your campus.
            </p>
            <p className="mt-5 text-xs text-white/40">{roomCount} home listings to explore</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-300">
              Browse homes <ArrowRightIcon width={14} height={14} />
            </span>
          </Link>
        </div>
      </Section>

      <Section className="border-t border-white/8 pt-10">
        <div className="cl-panel cl-panel-solid flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="text-xl font-bold text-white">Have an item or property to list?</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55">
              Post a used item, room, flat, or PG and manage your listing from your account.
            </p>
          </div>
          <Link href="/sell" className="cl-btn cl-btn-primary shrink-0">
            Create a listing <ArrowRightIcon width={15} height={15} />
          </Link>
        </div>
      </Section>
    </>
  );
}
