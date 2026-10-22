"use client";

import Link from "next/link";
import { SaveButton } from "@/components/Actions";
import { useCampusLoop } from "@/lib/store";
import { rupees } from "@/lib/format";
import type { Home } from "@/lib/data/homes";
import type { Listing } from "@/lib/types";
import { useCollection } from "@/lib/firebase/hooks";
import type { HomeMarketplaceListing } from "@/lib/firebase/marketplace";

export function SavedFavorites({
  listings,
  homes,
}: {
  listings: Listing[];
  homes: Home[];
}) {
  const { saved, hydrated } = useCampusLoop();
  const liveHomes = useCollection<HomeMarketplaceListing>("home_listings");

  if (!hydrated) {
    return <div className="cl-panel p-6 text-sm text-white/55">Loading your saved listings…</div>;
  }

  const savedItems = listings.filter((listing) => saved.includes(listing.id));
  const allHomes = [
    ...homes,
    ...liveHomes.data.filter((liveHome) => !homes.some((home) => home.id === liveHome.id)),
  ];
  const savedHomes = allHomes.filter((home) => saved.includes(`home:${home.id}`));
  const total = savedItems.length + savedHomes.length;

  if (total === 0) {
    return (
      <div className="cl-panel p-6">
        <h2 className="text-lg font-semibold text-white">No saved listings yet</h2>
        <p className="mt-2 text-sm text-white/55">Save a second-hand item or home listing to keep it here on this device.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/marketplace" className="cl-btn cl-btn-ghost">Browse second-hand items</Link>
          <Link href="/homes" className="cl-btn cl-btn-ghost">Browse rooms & PGs</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {savedItems.map((listing) => (
        <article key={listing.id} className="cl-panel flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <p className="text-[11px] text-white/40">Second-hand item</p>
            <Link
              href={listing.item_type === "device" ? `/devices/${listing.id}` : `/books/${listing.id}`}
              className="mt-1 block font-semibold text-white hover:text-brand-200"
            >
              {listing.title}
            </Link>
            <p className="mt-1 text-sm text-white/55">{rupees(listing.price)}</p>
          </div>
          <SaveButton id={listing.id} label="Star" />
        </article>
      ))}
      {savedHomes.map((home) => (
        <article key={`home:${home.id}`} className="cl-panel flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <p className="text-[11px] text-white/40">Room / flat / PG</p>
            <Link href={`/homes/${home.id}`} className="mt-1 block font-semibold text-white hover:text-brand-200">
              {home.title}
            </Link>
            <p className="mt-1 text-sm text-white/55">{home.locality} · {rupees(home.price)}{home.mode === "rent" ? " / month" : ""}</p>
          </div>
          <SaveButton id={`home:${home.id}`} label="Star" />
        </article>
      ))}
    </div>
  );
}
