"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { useCollection } from "@/lib/firebase/hooks";
import { db } from "@/lib/firebase/config";
import { rupees, titleCase } from "@/lib/format";
import { HOME_TYPE_LABELS } from "@/lib/data/homes";
import { DEVICE_CATEGORIES, getDeviceCategory } from "@/lib/marketplaceCategories";
import type { HomeMarketplaceListing } from "@/lib/firebase/marketplace";
import type { Listing } from "@/lib/types";

interface ListingInterest {
  id: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
}

interface HomeListingInterest {
  id: string;
  home_listing_id: string;
  owner_id: string;
  buyer_id: string;
  intent: "rental" | "purchase";
}

function SellerListings({ sellerId }: { sellerId: string }) {
  const listings = useCollection<Listing & { id: string }>("listings", {
    whereField: "seller_id",
    whereValue: sellerId,
  });
  const interests = useCollection<ListingInterest>("listing_interests", {
    whereField: "seller_id",
    whereValue: sellerId,
  });
  const homes = useCollection<HomeMarketplaceListing>("home_listings", {
    whereField: "owner_id",
    whereValue: sellerId,
  });
  const homeInterests = useCollection<HomeListingInterest>("home_listing_interests", {
    whereField: "owner_id",
    whereValue: sellerId,
  });
  const [buyerNames, setBuyerNames] = useState<Record<string, string>>({});
  const [buyerProfileError, setBuyerProfileError] = useState("");
  const buyerIdsKey = JSON.stringify([...new Set([
    ...interests.data.map((interest) => interest.buyer_id),
    ...homeInterests.data.map((interest) => interest.buyer_id),
  ])]);

  useEffect(() => {
    let cancelled = false;
    const buyerIds = JSON.parse(buyerIdsKey) as string[];
    setBuyerProfileError("");
    void Promise.all(buyerIds.map(async (buyerId) => {
      const profile = await getDoc(doc(db, "profiles", buyerId));
      const data = profile.data();
      return [buyerId, String(data?.name || data?.email || `Student ${buyerId.slice(0, 8)}`)] as const;
    })).then((entries) => {
      if (!cancelled) setBuyerNames(Object.fromEntries(entries));
    }).catch((error: unknown) => {
      console.error("Failed to load buyer profiles:", error);
      if (!cancelled) setBuyerProfileError("Buyer names could not be loaded.");
    });
    return () => {
      cancelled = true;
    };
  }, [buyerIdsKey]);

  const interestCounts = new Map<string, number>();
  const listingBuyers = new Map<string, string[]>();
  for (const interest of interests.data) {
    interestCounts.set(interest.listing_id, (interestCounts.get(interest.listing_id) ?? 0) + 1);
    listingBuyers.set(interest.listing_id, [...(listingBuyers.get(interest.listing_id) ?? []), interest.buyer_id]);
  }

  const homeInterestCounts = new Map<string, number>();
  const homeListingBuyers = new Map<string, HomeListingInterest[]>();
  for (const interest of homeInterests.data) {
    homeInterestCounts.set(
      interest.home_listing_id,
      (homeInterestCounts.get(interest.home_listing_id) ?? 0) + 1,
    );
    homeListingBuyers.set(
      interest.home_listing_id,
      [...(homeListingBuyers.get(interest.home_listing_id) ?? []), interest],
    );
  }

  if (listings.loading || homes.loading) return <p className="mt-6 text-sm text-white/50">Loading your listings…</p>;
  if (listings.error || interests.error || homes.error || homeInterests.error) {
    return <p role="alert" className="mt-6 text-sm text-rose-300">Could not load your listings or buyer interest.</p>;
  }
  if (listings.data.length === 0 && homes.data.length === 0) {
    return (
      <div className="cl-panel cl-panel-solid mt-6 p-6">
        <p className="text-sm text-white/60">You have not listed any second-hand items, rooms, flats, or PGs yet.</p>
        <Link href="/sell" className="cl-btn cl-btn-primary mt-4">Create a listing</Link>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-4">
      {listings.data.map((listing) => (
        <article key={listing.id} className="cl-panel cl-panel-solid flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-white">{listing.title}</h2>
              <span className={`cl-chip ${listing.status === "sold" ? "cl-chip-rose" : listing.status === "available" ? "cl-chip-mint" : "cl-chip-flare"}`}>
                {titleCase(listing.status)}
              </span>
              <span className="cl-chip">
                {listing.item_type === "device"
                  ? DEVICE_CATEGORIES.find((category) => category.value === getDeviceCategory(listing))?.label ?? "Other devices"
                  : "Book"}
              </span>
            </div>
            <p className="mt-2 text-sm text-white/55">{rupees(listing.price)} · Pickup: {listing.pickup_location || "Not provided"}</p>
            <p className="mt-1 text-xs text-white/40">{interestCounts.get(listing.id) ?? 0} buyers interested</p>
            {(listingBuyers.get(listing.id)?.length ?? 0) > 0 ? (
              <p className="mt-1 text-xs text-white/50">
                Interested: {listingBuyers.get(listing.id)?.map((buyerId) => buyerNames[buyerId] ?? "Loading buyer…").join(", ")}
              </p>
            ) : null}
          </div>
          <Link href={listing.item_type === "device" ? `/devices/${listing.id}` : `/books/${listing.id}`} className="cl-btn cl-btn-ghost">
            View listing
          </Link>
        </article>
      ))}
      {homes.data.map((home) => (
        <article key={home.id} className="cl-panel cl-panel-solid flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-white">{home.title}</h2>
              <span className="cl-chip">{HOME_TYPE_LABELS[home.type]}</span>
              <span className={`cl-chip ${home.mode === "rent" ? "cl-chip-mint" : "cl-chip-flare"}`}>
                {home.mode === "rent" ? "For rent" : "For sale"}
              </span>
            </div>
            <p className="mt-2 text-sm text-white/55">{rupees(home.price)} · {home.locality}</p>
            <p className="mt-1 text-xs text-white/40">{homeInterestCounts.get(home.id) ?? 0} people interested</p>
            {(homeListingBuyers.get(home.id)?.length ?? 0) > 0 ? (
              <ul className="mt-2 space-y-1 text-xs text-white/50">
                {homeListingBuyers.get(home.id)?.map((interest) => (
                  <li key={interest.id}>
                    {buyerNames[interest.buyer_id] ?? "Loading buyer…"} · {interest.intent === "purchase" ? "Interested in buying" : "Interested in renting"}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <Link href={`/homes/${home.id}`} className="cl-btn cl-btn-ghost">View property</Link>
        </article>
      ))}
      {buyerProfileError ? <p role="alert" className="text-xs text-rose-300">{buyerProfileError}</p> : null}
    </div>
  );
}

export default function MyListingsPage() {
  const { user, loading } = useAuth();

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight text-white">My Listings</h1>
      <p className="mt-2 text-sm text-white/50">See what you have posted, its status, views, saves, and buyer interest.</p>
      {loading ? <p className="mt-6 text-sm text-white/50">Checking your account…</p> : user ? (
        <SellerListings sellerId={user.uid} />
      ) : (
        <div className="cl-panel cl-panel-solid mt-6 p-6">
          <p className="text-sm text-white/60">Sign in to view and manage your listings.</p>
          <Link href="/login" className="cl-btn cl-btn-primary mt-4">Sign in</Link>
        </div>
      )}
    </section>
  );
}
