"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ListingCard } from "@/components/cards";
import { EmptyState } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";
import {
  campusOptions,
  customCampusId,
  customCampusName,
  isCustomCampusId,
  OTHER_CAMPUS_VALUE,
} from "@/lib/data/campusOptions";
import {
  readSettingsPreferences,
  saveSettingsPreferences,
  SETTINGS_PREFERENCES_EVENT,
} from "@/lib/settingsPreferences";
import type { College, Listing } from "@/lib/types";

type ItemFilter = "all" | "book" | "device";
type StatusFilter = "all" | "available" | "sold";

export function SecondhandMarketplace({
  listings,
  colleges,
}: {
  listings: Listing[];
  colleges: College[];
}) {
  const { user } = useAuth();
  const userId = user?.uid ?? "guest";
  const [itemType, setItemType] = useState<ItemFilter>("all");
  const [campusId, setCampusId] = useState("");
  const [customCampus, setCustomCampus] = useState("");
  const [status, setStatus] = useState<StatusFilter>("available");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const prefs = readSettingsPreferences(userId);
    setItemType(prefs.marketplaceCategory);
    setCampusId(prefs.marketplaceCampusId);
    setCustomCampus(customCampusName(prefs.marketplaceCampusId));
    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<{ userId: string; preferences: ReturnType<typeof readSettingsPreferences> }>).detail;
      if (detail?.userId !== userId) return;
      setItemType(detail.preferences.marketplaceCategory);
      setCampusId(detail.preferences.marketplaceCampusId);
      setCustomCampus(customCampusName(detail.preferences.marketplaceCampusId));
    };
    window.addEventListener(SETTINGS_PREFERENCES_EVENT, handleChange);
    return () => window.removeEventListener(SETTINGS_PREFERENCES_EVENT, handleChange);
  }, [userId]);

  const visibleListings = useMemo(() => {
    const term = search.trim().toLowerCase();
    return listings.filter((listing) => {
      const listingType = listing.item_type ?? "book";
      if (itemType !== "all" && listingType !== itemType) return false;
      if (
        campusId
        && campusId !== OTHER_CAMPUS_VALUE
        && listing.college_id !== campusId
      ) return false;
      if (status !== "all" && listing.status !== status) return false;
      return !term || [
        listing.title,
        listing.author,
        listing.edition,
        listing.subject,
        listing.description,
        listing.pickup_location ?? "",
      ].join(" ").toLowerCase().includes(term);
    });
  }, [campusId, itemType, listings, search, status]);

  return (
    <>
      <div className="cl-panel cl-panel-solid grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto]">
        <input
          className="cl-input"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search books, devices, sellers, pickup locations…"
          aria-label="Search second-hand listings"
        />
        <select
          className="cl-input sm:w-48"
          value={itemType}
          onChange={(event) => {
            const nextCategory = event.target.value as ItemFilter;
            setItemType(nextCategory);
            saveSettingsPreferences(userId, { marketplaceCategory: nextCategory });
          }}
          aria-label="Filter by item type"
        >
          <option value="all">Books & devices</option>
          <option value="book">Books</option>
          <option value="device">Devices</option>
        </select>
        <select
          className="cl-input sm:w-48"
          aria-label="Filter by campus"
          value={
            campusId === OTHER_CAMPUS_VALUE || isCustomCampusId(campusId)
              ? OTHER_CAMPUS_VALUE
              : campusId
          }
          onChange={(event) => {
            const value = event.target.value;
            const nextCampusId = value === OTHER_CAMPUS_VALUE
              ? customCampus.trim() ? customCampusId(customCampus) : OTHER_CAMPUS_VALUE
              : value;
            setCampusId(nextCampusId);
            if (value !== OTHER_CAMPUS_VALUE) setCustomCampus("");
            saveSettingsPreferences(userId, { marketplaceCampusId: nextCampusId });
          }}
        >
          <option value="">All campuses</option>
          {campusOptions.map((campus) => <option key={campus.id} value={campus.id}>{campus.short_name}</option>)}
          <option value={OTHER_CAMPUS_VALUE}>Other</option>
        </select>
        {campusId === OTHER_CAMPUS_VALUE || isCustomCampusId(campusId) ? (
          <input
            className="cl-input"
            value={customCampus}
            onChange={(event) => {
              const name = event.target.value;
              const nextCampusId = name.trim() ? customCampusId(name) : OTHER_CAMPUS_VALUE;
              setCustomCampus(name);
              setCampusId(nextCampusId);
              saveSettingsPreferences(userId, { marketplaceCampusId: nextCampusId });
            }}
            placeholder="Enter your college name"
            aria-label="Enter your college name"
            maxLength={120}
          />
        ) : null}
        <select className="cl-input sm:w-48" value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} aria-label="Filter by status">
          <option value="available">Available</option>
          <option value="sold">Sold</option>
          <option value="all">All statuses</option>
        </select>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-white/45">{visibleListings.length} second-hand {visibleListings.length === 1 ? "listing" : "listings"}</p>
        <div className="flex gap-2">
          <Link href="/sell?type=book" className="cl-btn cl-btn-ghost">Sell a book</Link>
          <Link href="/sell?type=device" className="cl-btn cl-btn-primary">Sell a device</Link>
        </div>
      </div>

      {visibleListings.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visibleListings.map((listing) => <ListingCard key={listing.id} listing={listing} colleges={colleges} />)}
        </div>
      ) : (
        <EmptyState
          title="No listings match these filters"
          description="Try another search or status. Newly published books and devices appear here."
          action={<Link href="/sell" className="cl-btn cl-btn-primary">List an item</Link>}
        />
      )}
      <p className="mt-6 text-xs text-white/40">
        Open a listing to register buyer interest. Sellers can see interested buyers in My Listings; only the admin can edit, remove, or mark any listing sold.
      </p>
    </>
  );
}
