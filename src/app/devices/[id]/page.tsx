import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingInterestButton } from "@/components/ListingInterestButton";
import { KeyValue, Section } from "@/components/ui";
import { getListing } from "@/lib/queries";
import { rupees } from "@/lib/format";
import { DEVICE_CATEGORIES, getDeviceCategory } from "@/lib/marketplaceCategories";
import type { Listing } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  return listing?.item_type === "device"
    ? { title: listing.title, description: listing.description.slice(0, 155) }
    : { title: "Second-hand listing not found" };
}

function DeviceListing({ listing }: { listing: Listing }) {
  const deviceCategory = DEVICE_CATEGORIES.find((category) => category.value === getDeviceCategory(listing));
  return (
    <Section className="py-8">
      <nav className="mb-6 flex items-center gap-2 text-xs text-white/40" aria-label="Breadcrumb">
        <Link href="/marketplace" className="transition hover:text-white">Second-hand items</Link>
        <span aria-hidden>/</span>
        <span className="truncate text-white/70">{listing.title}</span>
      </nav>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="cl-panel cl-panel-solid flex min-h-64 items-center justify-center p-8">
          <span className="text-8xl" aria-hidden>{listing.emoji || "💻"}</span>
        </div>
        <div className="cl-panel cl-panel-solid p-6">
          <div className="flex flex-wrap gap-2">
            <span className="cl-chip cl-chip-brand">{deviceCategory?.label ?? "Second-hand device"}</span>
            <span className="cl-chip">{listing.status === "available" ? "Available" : listing.status}</span>
            <span className="cl-chip">{listing.condition.replaceAll("_", " ")}</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">{listing.title}</h1>
          <p className="mt-2 text-sm text-white/55">{listing.author} · {listing.edition}</p>
          <p className="mt-4 text-3xl font-black text-white">{rupees(listing.price)}</p>
          <p className="mt-4 text-sm leading-relaxed text-white/60">{listing.description}</p>
          <dl className="mt-5 grid gap-3">
            <KeyValue label="Category / details" value={listing.subject} />
            <KeyValue label="Pickup address" value={listing.pickup_location || "Contact seller"} />
          </dl>
          <div className="mt-6">
            <ListingInterestButton listingId={listing.id} status={listing.status} />
          </div>
          <p className="mt-4 text-xs text-white/45">
            Agree on price, payment, and handover directly with the seller.
          </p>
        </div>
      </div>
    </Section>
  );
}

export default async function DeviceListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(id);
  if (listing?.item_type !== "device") notFound();
  return <DeviceListing listing={listing} />;
}
