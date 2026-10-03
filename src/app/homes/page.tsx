import type { Metadata } from "next";
import Link from "next/link";
import { HomesBrowser } from "@/components/HomesBrowser";
import { PageHeader, Section } from "@/components/ui";
import { HOMES } from "@/lib/data/homes";

export const metadata: Metadata = {
  title: "Homes & Rooms",
  description:
    "Rent a PG, a separate room, or 1/2/3/4 BHK homes near your campus — and list your own home or room for rent or sale.",
};

export default function HomesPage() {
  const forRent = HOMES.filter((h) => h.mode === "rent").length;
  const forSale = HOMES.filter((h) => h.mode === "sale").length;

  return (
    <>
      <PageHeader
        eyebrow="Homes · PG · Rent & Buy"
        title="A bed, a room, or the whole 4 BHK — near your campus"
        description="Rent a PG or separate room, or browse 1 RK through 4 BHK homes for rent and sale. Every listing is verified and tied to a real locality on CampusLoop."
      >
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{forRent}</p>
          <p className="text-[11px] text-white/45">homes for rent</p>
        </div>
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{forSale}</p>
          <p className="text-[11px] text-white/45">homes for sale</p>
        </div>
      </PageHeader>
      <Section className="pt-6">
        <HomesBrowser homes={HOMES} />
        <div className="mt-10 cl-panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Own an empty room, flat or home?</p>
            <p className="mt-1 text-xs leading-relaxed text-white/55">
              List it for rent or sale in under a minute and reach verified students near your locality.
            </p>
          </div>
          <Link href="/sell?type=home" className="cl-btn cl-btn-primary shrink-0">
            Sell / list my home
          </Link>
        </div>
      </Section>
    </>
  );
}
