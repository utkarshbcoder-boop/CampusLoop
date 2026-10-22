import type { Metadata } from "next";
import { HomeListingDetail } from "@/components/HomeListingDetail";
import { HOMES } from "@/lib/data/homes";

export const metadata: Metadata = {
  title: "Property details",
  description: "View details and register interest in a room, flat, or PG listing.",
};

export default async function HomeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sample = HOMES.find((home) => home.id === id);
  return <HomeListingDetail id={id} sample={sample} />;
}
