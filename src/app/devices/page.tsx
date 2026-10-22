import type { Metadata } from "next";
import { DeviceMarketplace } from "@/components/DeviceMarketplace";
import { PageHeader, Section } from "@/components/ui";
import { getColleges, getSecondhandListings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Second-hand Phones, Laptops & Tablets",
  description: "Browse used phones, laptops, and tablets from campus sellers.",
};

export default async function DevicesPage() {
  const [listings, colleges] = await Promise.all([
    getSecondhandListings("device"),
    getColleges(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Second-hand items · Devices"
        title="Phones, laptops & tablets"
        description="Browse second-hand devices, compare details, and contact sellers before arranging a handover."
      />
      <Section className="pt-6">
        <DeviceMarketplace listings={listings} colleges={colleges} />
      </Section>
    </>
  );
}
