"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ListingGrid } from "@/components/ListingGrid";
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
import { DEVICE_CATEGORIES, getDeviceCategory } from "@/lib/marketplaceCategories";
import { ITEM_EXPIRY_DAYS } from "@/lib/expiry";
import type { College, Listing } from "@/lib/types";

type ItemFilter = "all" | "book" | "device";
type DeviceFilter = "all" | "mobile" | "laptop" | "tablet" | "other";
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
  const userIdRef = useRef(userId);
  const [itemType, setItemType] = useState<ItemFilter>("all");
  const [deviceType, setDeviceType] = useState<DeviceFilter>("all");
  const [campusId, setCampusId] = useState("");
  const [customCampus, setCustomCampus] = useState("");
  const [status, setStatus] = useState<StatusFilter>("available");
  const [search, setSearch] = useState("");

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // Apply stored preference defaults only once on mount so that auth resolving
  // (userId flipping from "guest" to the real uid) does not wipe the filters
  // the visitor chose in-session. Later changes come only from the settings event.
  useEffect(() => {
    const applyPreferences = (prefs: ReturnType<typeof readSettingsPreferences>) => {
      setItemType(prefs.marketplaceCategory);
      if (prefs.marketplaceCategory !== "device") setDeviceType("all");
      setCampusId(prefs.marketplaceCampusId);
      setCustomCampus(customCampusName(prefs.marketplaceCampusId));
    };
    applyPreferences(readSettingsPreferences(userIdRef.current));
    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<{ userId: string; preferences: ReturnType<typeof readSettingsPreferences> }>).detail;
      if (detail?.userId !== userIdRef.current) return;
      applyPreferences(detail.preferences);
    };
    window.addEventListener(SETTINGS_PREFERENCES_EVENT, handleChange);
    return () => window.removeEventListener(SETTINGS_PREFERENCES_EVENT, handleChange);
  }, []);

  const visibleListings = useMemo(() => {
    const term = search.trim().toLowerCase();
    return listings.filter((listing) => {
      const listingType = listing.item_type ?? "book";
      if (itemType !== "all" && listingType !== itemType) return false;
      if (deviceType !== "all" && (listingType !== "device" || getDeviceCategory(listing) !== deviceType)) return false;
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
  }, [campusId, deviceType, itemType, listings, search, status]);

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
            if (nextCategory !== "device") setDeviceType("all");
            saveSettingsPreferences(userId, { marketplaceCategory: nextCategory });
          }}
          aria-label="Filter by item type"
        >
          <option value="all">Books & devices</option>
          <option value="book">Books</option>
          <option value="device">Devices: phones, laptops & tablets</option>
        </select>
        <select
          className="cl-input sm:w-48"
          value={deviceType}
          onChange={(event) => {
            const nextType = event.target.value as DeviceFilter;
            setDeviceType(nextType);
            if (nextType !== "all") {
              setItemType("device");
              saveSettingsPreferences(userId, { marketplaceCategory: "device" });
            }
          }}
          aria-label="Filter by device type"
        >
          <option value="all">All device types</option>
          {DEVICE_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>{category.label}</option>
          ))}
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
        <div className="flex flex-wrap gap-2">
          <Link href="/books" className="cl-btn cl-btn-ghost">Browse books</Link>
          <Link href="/devices" className="cl-btn cl-btn-ghost">Browse phones, laptops &amp; tablets</Link>
          <Link href="/sell?type=both" className="cl-btn cl-btn-primary">Sell books &amp; devices</Link>
        </div>
      </div>

      {visibleListings.length ? (
        <ListingGrid listings={visibleListings} colleges={colleges} />
      ) : (
        <EmptyState
          title="No listings match these filters"
          description="Try another search or status. Newly published books and devices appear here."
          action={<Link href="/sell" className="cl-btn cl-btn-primary">List an item</Link>}
        />
      )}
      <p className="mt-6 text-xs text-white/40">
        Open a listing to register buyer interest. Sellers can see interested buyers in My Listings and edit, renew, or remove their own listings; only the admin can moderate anyone else&apos;s. Listings stay live for {ITEM_EXPIRY_DAYS} days before the seller lists them again.
      </p>
    </>
  );
}
