import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/ui";
import { SecondhandMarketplace } from "@/components/SecondhandMarketplace";
import { getColleges, getSecondhandListings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Second-hand Marketplace",
  description: "Browse second-hand books and devices listed by students and contact sellers about available items.",
};

export default async function MarketplacePage() {
  const [listings, colleges] = await Promise.all([
    getSecondhandListings(),
    getColleges(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Student marketplace"
        title="Second-hand listings, all in one place"
        description="Browse pre-owned books and devices. Check availability and pickup details, then contact the seller directly."
      />
      <Section className="pt-6">
        <SecondhandMarketplace listings={listings} colleges={colleges} />
      </Section>
    </>
  );
}
