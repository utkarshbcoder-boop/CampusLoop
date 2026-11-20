"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useCollection } from "@/lib/firebase/hooks";
import { db } from "@/lib/firebase/config";
import { rupees, titleCase } from "@/lib/format";
import { HOME_TYPE_LABELS } from "@/lib/data/homes";
import { DEVICE_CATEGORIES, getDeviceCategory } from "@/lib/marketplaceCategories";
import {
  deleteHomeListing,
  deleteMarketplaceListing,
  markListingSold,
  renewHomeListing,
  renewListing,
  setHomeListingStatus,
  type HomeListingStatus,
  type HomeMarketplaceListing,
} from "@/lib/firebase/marketplace";
import { openSellerConversation } from "@/lib/firebase/messaging";
import { ListingEditDialog } from "@/components/ListingEditDialog";
import {
  HOME_EXPIRY_DAYS,
  ITEM_EXPIRY_DAYS,
  effectiveHomeStatus,
  effectiveItemStatus,
} from "@/lib/expiry";
import { isSampleListing } from "@/lib/listingUtils";
import type { Listing, ListingStatus } from "@/lib/types";

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

const ITEM_STATUS_ACTIONS: { value: ListingStatus; label: string }[] = [
  { value: "available", label: "Mark available" },
  { value: "reserved", label: "Mark reserved" },
  { value: "sold", label: "Mark sold" },
];

const HOME_STATUS_OPTIONS: { value: HomeListingStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "rented", label: "Rented" },
  { value: "sold", label: "Sold" },
  { value: "withdrawn", label: "Withdrawn" },
];

/** Surface friendly Errors thrown by our helpers; fall back for Firestore failures. */
function friendlyError(cause: unknown, fallback: string): string {
  if (cause instanceof Error && cause.message.length > 0 && !("code" in cause)) {
    return cause.message;
  }
  return fallback;
}

function ListingRow({
  listing,
  sellerId,
  interestCount,
  buyers,
  buyerNames,
  showMessageBuyers,
  onDeleted,
}: {
  listing: Listing;
  sellerId: string;
  interestCount: number;
  buyers: string[];
  buyerNames: Record<string, string>;
  /** Shop dashboard: start a conversation with an interested buyer. */
  showMessageBuyers: boolean;
  onDeleted: (message: string) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"" | "status" | "delete" | "renew">("");
  const [messaging, setMessaging] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  const sample = isSampleListing(listing);
  const itemStatus = effectiveItemStatus(listing);
  const expired = itemStatus === "expired";
  const createdMs = Date.parse(listing.created_at);
  const daysLeft = Number.isNaN(createdMs)
    ? null
    : Math.ceil(ITEM_EXPIRY_DAYS - (Date.now() - createdMs) / 86_400_000);
  const showDaysLeft = !sample && !expired && daysLeft !== null && daysLeft > 0 && daysLeft <= 15;

  async function changeStatus(next: ListingStatus) {
    setBusy("status");
    setNotice("");
    setError("");
    try {
      await markListingSold(listing.id, sellerId, next);
      setNotice(`Listing marked ${titleCase(next)}.`);
      router.refresh();
    } catch (cause) {
      console.error("Failed to update listing status:", cause);
      setError(friendlyError(cause, "Could not update the listing. Please try again."));
    } finally {
      setBusy("");
    }
  }

  async function renew() {
    setBusy("renew");
    setNotice("");
    setError("");
    try {
      await renewListing(listing.id, sellerId);
      setNotice(`Listed again — good for ${ITEM_EXPIRY_DAYS} more days.`);
      router.refresh();
    } catch (cause) {
      console.error("Failed to renew listing:", cause);
      setError(friendlyError(cause, "Could not renew the listing. Please try again."));
    } finally {
      setBusy("");
    }
  }

  async function remove() {
    if (!window.confirm("Delete this listing permanently? This cannot be undone.")) return;
    setBusy("delete");
    setNotice("");
    setError("");
    try {
      await deleteMarketplaceListing(listing.id, sellerId);
      onDeleted("Listing deleted.");
      router.refresh();
    } catch (cause) {
      console.error("Failed to delete listing:", cause);
      setError(friendlyError(cause, "Could not delete the listing. Please try again."));
    } finally {
      setBusy("");
    }
  }

  async function messageBuyer(buyerId: string) {
    setMessaging(buyerId);
    setError("");
    try {
      const result = await openSellerConversation({
        targetType: "listing",
        targetId: listing.id,
        targetTitle: listing.title,
        buyerId,
        sellerId,
      });
      router.push(`/messages/${result.conversationId}`);
    } catch (cause) {
      console.error("Failed to open conversation with buyer:", cause);
      setError(
        "Could not start the conversation. The listing must be available for new threads — check its status.",
      );
    } finally {
      setMessaging("");
    }
  }

  return (
    <article className="cl-panel cl-panel-solid flex flex-wrap items-center justify-between gap-4 p-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-base font-semibold text-white">{listing.title}</h2>
          <span className={`cl-chip ${itemStatus === "sold" ? "cl-chip-rose" : itemStatus === "available" ? "cl-chip-mint" : "cl-chip-flare"}`}>
            {titleCase(itemStatus)}
          </span>
          <span className="cl-chip">
            {listing.item_type === "device"
              ? DEVICE_CATEGORIES.find((category) => category.value === getDeviceCategory(listing))?.label ?? "Other devices"
              : "Book"}
          </span>
          {listing.shop_name ? <span className="cl-chip">🏪 {listing.shop_name}</span> : null}
          {expired ? <span className="cl-chip">Expired</span> : null}
          {showDaysLeft ? (
            <span className="cl-chip" suppressHydrationWarning>{daysLeft} days left</span>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-white/55">{rupees(listing.price)} · Pickup: {listing.pickup_location || "Not provided"}</p>
        <p className="mt-1 text-xs text-white/40">{interestCount} buyers interested</p>
        {buyers.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-white/50">
            <span className="text-white/40">Interested:</span>
            {buyers.map((buyerId) => (
              <span key={buyerId} className="inline-flex items-center gap-1.5 rounded-full bg-white/6 px-2 py-0.5">
                {buyerNames[buyerId] ?? "Loading buyer…"}
                {showMessageBuyers ? (
                  <button
                    type="button"
                    onClick={() => void messageBuyer(buyerId)}
                    disabled={busy !== "" || messaging !== ""}
                    className="font-semibold text-brand-300 transition hover:text-brand-200 disabled:opacity-50"
                  >
                    {messaging === buyerId ? "Opening…" : "Message"}
                  </button>
                ) : null}
              </span>
            ))}
          </div>
        ) : null}
        {listing.shop_address ? (
          <p className="mt-1 text-xs text-white/40">🏪 {listing.shop_address}</p>
        ) : null}
        {notice ? <p role="status" className="mt-2 text-xs text-mint-300">{notice}</p> : null}
        {error ? <p role="alert" className="mt-2 text-xs text-rose-300">{error}</p> : null}
      </div>
      <div className="flex flex-col items-start gap-2 sm:items-end">
        <Link href={listing.item_type === "device" ? `/devices/${listing.id}` : `/books/${listing.id}`} className="cl-btn cl-btn-ghost">
          View listing
        </Link>
        {sample ? (
          <p className="text-[11px] text-white/40">Sample listings cannot be edited.</p>
        ) : (
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={busy !== ""}
              className="cl-btn cl-btn-ghost px-2.5 py-1 text-xs disabled:opacity-50"
            >
              Edit
            </button>
            {ITEM_STATUS_ACTIONS.filter((action) => action.value !== listing.status).map((action) => (
              <button
                key={action.value}
                type="button"
                onClick={() => void changeStatus(action.value)}
                disabled={busy !== ""}
                className="cl-btn cl-btn-ghost px-2.5 py-1 text-xs disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
            {expired ? (
              <button
                type="button"
                onClick={() => void renew()}
                disabled={busy !== ""}
                className="cl-btn cl-btn-ghost px-2.5 py-1 text-xs disabled:opacity-50"
              >
                Renew
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void remove()}
              disabled={busy !== ""}
              className="cl-btn cl-btn-ghost px-2.5 py-1 text-xs text-rose-300 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>
      {editing ? (
        <ListingEditDialog
          target={{ kind: "item", sellerId, listing }}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setNotice("Changes saved.");
            router.refresh();
          }}
        />
      ) : null}
    </article>
  );
}

function HomeRow({
  home,
  ownerId,
  interestCount,
  buyers,
  buyerNames,
  showMessageBuyers,
  onDeleted,
}: {
  home: HomeMarketplaceListing;
  ownerId: string;
  interestCount: number;
  buyers: HomeListingInterest[];
  buyerNames: Record<string, string>;
  /** Shop dashboard: start a conversation with an interested buyer. */
  showMessageBuyers: boolean;
  onDeleted: (message: string) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"" | "status" | "delete" | "renew">("");
  const [messaging, setMessaging] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  const homeStatus = effectiveHomeStatus(home);
  const homeExpired = homeStatus === "expired";

  async function changeStatus(next: HomeListingStatus) {
    setBusy("status");
    setNotice("");
    setError("");
    try {
      await setHomeListingStatus(home.id, ownerId, next);
      setNotice(`Status updated to ${titleCase(next)}.`);
      router.refresh();
    } catch (cause) {
      console.error("Failed to update status:", cause);
      setError(friendlyError(cause, "Could not update the status. Please try again."));
    } finally {
      setBusy("");
    }
  }

  async function renew() {
    setBusy("renew");
    setNotice("");
    setError("");
    try {
      await renewHomeListing(home.id, ownerId);
      setNotice(`Listed again — good for ${HOME_EXPIRY_DAYS} more days.`);
      router.refresh();
    } catch (cause) {
      console.error("Failed to renew listing:", cause);
      setError(friendlyError(cause, "Could not renew the listing. Please try again."));
    } finally {
      setBusy("");
    }
  }

  async function remove() {
    if (!window.confirm("Delete this property listing permanently? This cannot be undone.")) return;
    setBusy("delete");
    setNotice("");
    setError("");
    try {
      await deleteHomeListing(home.id, ownerId);
      onDeleted("Property listing deleted.");
      router.refresh();
    } catch (cause) {
      console.error("Failed to delete property listing:", cause);
      setError(friendlyError(cause, "Could not delete the listing. Please try again."));
    } finally {
      setBusy("");
    }
  }

  async function messageBuyer(buyerId: string) {
    setMessaging(buyerId);
    setError("");
    try {
      const result = await openSellerConversation({
        targetType: "home",
        targetId: home.id,
        targetTitle: home.title,
        buyerId,
        sellerId: ownerId,
      });
      router.push(`/messages/${result.conversationId}`);
    } catch (cause) {
      console.error("Failed to open conversation with buyer:", cause);
      setError("Could not start the conversation. Please try again.");
    } finally {
      setMessaging("");
    }
  }

  return (
    <article className="cl-panel cl-panel-solid flex flex-wrap items-center justify-between gap-4 p-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-base font-semibold text-white">{home.title}</h2>
          <span className="cl-chip">{HOME_TYPE_LABELS[home.type]}</span>
          <span className={`cl-chip ${home.mode === "rent" ? "cl-chip-mint" : "cl-chip-flare"}`}>
            {home.mode === "rent" ? "For rent" : "For sale"}
          </span>
          {home.shop_name ? <span className="cl-chip">🏪 {home.shop_name}</span> : null}
          {homeExpired ? <span className="cl-chip">Expired</span> : null}
        </div>
        <p className="mt-2 text-sm text-white/55">{rupees(home.price)} · {home.locality}</p>
        <p className="mt-1 text-xs text-white/40">{interestCount} people interested</p>
        {buyers.length > 0 ? (
          <ul className="mt-2 space-y-1 text-xs text-white/50">
            {buyers.map((interest) => (
              <li key={interest.id} className="flex flex-wrap items-center gap-2">
                <span>
                  {buyerNames[interest.buyer_id] ?? "Loading buyer…"} · {interest.intent === "purchase" ? "Interested in buying" : "Interested in renting"}
                </span>
                {showMessageBuyers ? (
                  <button
                    type="button"
                    onClick={() => void messageBuyer(interest.buyer_id)}
                    disabled={busy !== "" || messaging !== ""}
                    className="font-semibold text-brand-300 transition hover:text-brand-200 disabled:opacity-50"
                  >
                    {messaging === interest.buyer_id ? "Opening…" : "Message"}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        {home.shop_address ? (
          <p className="mt-1 text-xs text-white/40">🏪 {home.shop_address}</p>
        ) : null}
        {notice ? <p role="status" className="mt-2 text-xs text-mint-300">{notice}</p> : null}
        {error ? <p role="alert" className="mt-2 text-xs text-rose-300">{error}</p> : null}
      </div>
      <div className="flex flex-col items-start gap-2 sm:items-end">
        <Link href={`/homes/${home.id}`} className="cl-btn cl-btn-ghost">View property</Link>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <label className="flex items-center gap-1.5 text-[11px] text-white/50">
            Status
            <select
              className="cl-input w-auto px-2 py-1 text-xs"
              aria-label={`Status for ${home.title}`}
              value={home.status ?? "available"}
              disabled={busy !== ""}
              onChange={(event) => void changeStatus(event.target.value as HomeListingStatus)}
            >
              {HOME_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-ink-900">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={busy !== ""}
            className="cl-btn cl-btn-ghost px-2.5 py-1 text-xs disabled:opacity-50"
          >
            Edit
          </button>
          {homeExpired ? (
            <button
              type="button"
              onClick={() => void renew()}
              disabled={busy !== ""}
              className="cl-btn cl-btn-ghost px-2.5 py-1 text-xs disabled:opacity-50"
            >
              Renew
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void remove()}
            disabled={busy !== ""}
            className="cl-btn cl-btn-ghost px-2.5 py-1 text-xs text-rose-300 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
      {editing ? (
        <ListingEditDialog
          target={{ kind: "home", ownerId, home }}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setNotice("Changes saved.");
            router.refresh();
          }}
        />
      ) : null}
    </article>
  );
}

/**
 * A seller's listings with live buyer interest (count + names).
 *
 * Shared by `/my-listings` (students) and `/shop` (shopkeepers, who can also
 * message interested buyers directly). Firestore rules are the enforcement
 * layer: interest lists only ever return rows where the caller is the seller.
 */
export function SellerListings({
  sellerId,
  showMessageBuyers = false,
}: {
  sellerId: string;
  showMessageBuyers?: boolean;
}) {
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
  const [rowNotice, setRowNotice] = useState("");
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
      {rowNotice ? <p role="status" className="text-xs text-mint-300">{rowNotice}</p> : null}
      {listings.data.map((listing) => (
        <ListingRow
          key={listing.id}
          listing={listing}
          sellerId={sellerId}
          interestCount={interestCounts.get(listing.id) ?? 0}
          buyers={listingBuyers.get(listing.id) ?? []}
          buyerNames={buyerNames}
          showMessageBuyers={showMessageBuyers}
          onDeleted={(message) => setRowNotice(message)}
        />
      ))}
      {homes.data.map((home) => (
        <HomeRow
          key={home.id}
          home={home}
          ownerId={sellerId}
          interestCount={homeInterestCounts.get(home.id) ?? 0}
          buyers={homeListingBuyers.get(home.id) ?? []}
          buyerNames={buyerNames}
          showMessageBuyers={showMessageBuyers}
          onDeleted={(message) => setRowNotice(message)}
        />
      ))}
      {buyerProfileError ? <p role="alert" className="text-xs text-rose-300">{buyerProfileError}</p> : null}
    </div>
  );
}
