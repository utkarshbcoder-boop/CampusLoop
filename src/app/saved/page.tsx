import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/ui";
import { SavedFavorites } from "@/components/SavedFavorites";
import { HOMES } from "@/lib/data/homes";
import { getListings, getPGListings, parseListingFilters, parsePGFilters } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Saved Favorites",
  description: "Your starred campus books, rooms, and PG listings.",
};

export default async function SavedPage() {
  const [listings, pgListings] = await Promise.all([
    getListings(parseListingFilters({})),
    getPGListings(parsePGFilters({})),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Premium · Favorites"
        title="Your saved listings"
        description="Find the books, rooms, and PG listings you starred again in one place."
      />
      <Section className="pt-6">
        <SavedFavorites listings={listings} pgListings={pgListings} homes={HOMES} />
      </Section>
    </>
  );
}
