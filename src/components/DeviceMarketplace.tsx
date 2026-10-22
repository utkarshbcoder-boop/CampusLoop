"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ListingCard } from "@/components/cards";
import { EmptyState } from "@/components/ui";
import { DEVICE_CATEGORIES, getDeviceCategory } from "@/lib/marketplaceCategories";
import type { College, DeviceCategory, Listing } from "@/lib/types";

export function DeviceMarketplace({
  listings,
  colleges,
}: {
  listings: Listing[];
  colleges: College[];
}) {
  const [category, setCategory] = useState<DeviceCategory | "all">("all");
  const [search, setSearch] = useState("");
  const visibleListings = useMemo(() => {
    const term = search.trim().toLowerCase();
    return listings.filter((listing) => {
      if (category !== "all" && getDeviceCategory(listing) !== category) return false;
      return !term || [
        listing.title,
        listing.author,
        listing.edition,
        listing.subject,
        listing.description,
        listing.pickup_location ?? "",
      ].join(" ").toLowerCase().includes(term);
    });
  }, [category, listings, search]);

  return (
    <>
      <div className="cl-panel cl-panel-solid grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
        <input
          className="cl-input"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search phones, laptops, tablets, brands or specs…"
          aria-label="Search devices"
        />
        <select
          className="cl-input sm:w-52"
          value={category}
          onChange={(event) => setCategory(event.target.value as DeviceCategory | "all")}
          aria-label="Filter by device type"
        >
          <option value="all">All devices</option>
          {DEVICE_CATEGORIES.filter((device) => device.value !== "other").map((device) => (
            <option key={device.value} value={device.value}>{device.label}</option>
          ))}
          <option value="other">Other devices</option>
        </select>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-white/45">
          {visibleListings.length} second-hand {visibleListings.length === 1 ? "device" : "devices"}
        </p>
        <Link href="/sell?type=device" className="cl-btn cl-btn-primary">
          List a phone, laptop or tablet
        </Link>
      </div>

      {visibleListings.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visibleListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} colleges={colleges} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No devices match these filters"
          description="Try a different search or device type, or be the first to list one."
          action={
            <Link href="/sell?type=device" className="cl-btn cl-btn-primary">
              List a phone, laptop or tablet
            </Link>
          }
        />
      )}
    </>
  );
}
