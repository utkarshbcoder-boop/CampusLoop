import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/ui";
import { SavedFavorites } from "@/components/SavedFavorites";
import { HOMES } from "@/lib/data/homes";
import { getSecondhandListings } from "@/lib/queries";

// Request-time render: the saved-items lookup needs current listings, not a
// build-time snapshot (matches /marketplace).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saved Listings",
  description: "Your saved second-hand items, rooms, flats, and PG listings.",
};

export default async function SavedPage() {
  const listings = await getSecondhandListings().catch((cause: unknown) => {
    console.error("Saved page: failed to load listings:", cause);
    return [];
  });

  return (
    <>
      <PageHeader
        eyebrow="Your marketplace"
        title="Your saved listings"
        description="Find your saved second-hand items, rooms, flats, and PG listings in one place."
      />
      <Section className="pt-6">
        <SavedFavorites listings={listings} homes={HOMES} />
      </Section>
    </>
  );
}
