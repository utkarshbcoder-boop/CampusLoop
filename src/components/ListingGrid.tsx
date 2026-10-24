"use client";

import { useEffect, useState } from "react";
import { ListingCard } from "@/components/cards";
import type { College, Listing } from "@/lib/types";

const PAGE_SIZE = 20;

export function ListingGrid({
  listings,
  colleges,
}: {
  listings: Listing[];
  colleges: College[];
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const listingIds = listings.map((listing) => listing.id).join(",");
  useEffect(() => setVisibleCount(PAGE_SIZE), [listingIds]);
  const visibleListings = listings.slice(0, visibleCount);

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {visibleListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} colleges={colleges} />
        ))}
      </div>
      <div className="mt-6 text-center">
        <p className="mb-3 text-xs text-white/45">
          Showing {visibleListings.length} of {listings.length} listings
        </p>
        {visibleCount < listings.length ? (
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="cl-btn cl-btn-ghost"
          >
            Show more listings
          </button>
        ) : null}
      </div>
    </>
  );
}
