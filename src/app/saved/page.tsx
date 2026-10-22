import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/ui";
import { SavedFavorites } from "@/components/SavedFavorites";
import { HOMES } from "@/lib/data/homes";
import { getSecondhandListings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Saved Listings",
  description: "Your saved second-hand items, rooms, flats, and PG listings.",
};

export default async function SavedPage() {
  const listings = await getSecondhandListings();

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
