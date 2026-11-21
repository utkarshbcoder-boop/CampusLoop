/**
 * Auctions — "sell to the highest bidder" (all listing types).
 *
 * Contract (mirrored by firestore.rules):
 *  - One open auction per listing. The seller starts it with a 24h / 48h / 7d
 *    window; `auction_ends_at` is a Firestore Timestamp so rules can require
 *    it to be in the future (and <= 7 days out) and reject bids after it.
 *  - Every bid is written in ONE transaction together with the listing's
 *    standing (`highest_bid`, `highest_bidder`, `bid_count`). Rules require
 *    the amount to beat the current top, so the standing is monotonic and
 *    server-enforced — clients cannot fake a leading bid.
 *  - Deterministic bid ids `${targetType}_${targetId}_${bidderId}`: one
 *    standing entry per bidder; raising overwrites in place. Bids are final
 *    (delete is admin-only).
 *  - When the countdown ends the highest bid wins, but the listing is only
 *    marked sold when the seller taps "Sell to highest bidder" (this project
 *    has no server cron) — the winner is notified at that moment.
 *  - Auction keys are only writable by the listing's owner (or admin);
 *    bidders may touch exactly `highest_bid` / `highest_bidder` / `bid_count`.
 */

import {
  collection,
  deleteField,
  doc,
  runTransaction,
  Timestamp,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./config";
import { markListingSold, setHomeListingStatus } from "./marketplace";
import { createNotification } from "./notifications";
import { toMs } from "@/lib/auction";

export type AuctionTargetType = "listing" | "home";

/** A bidder's standing entry (name denormalised so the board needs no profile reads). */
export interface Bid {
  id: string;
  target_type: AuctionTargetType;
  target_id: string;
  bidder_id: string;
  bidder_name: string;
  seller_id: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

const AUCTION_COLLECTION: Record<AuctionTargetType, string> = {
  listing: "listings",
  home: "home_listings",
};

function deepLinkFor(targetType: AuctionTargetType, targetId: string, itemType?: string): string {
  if (targetType === "home") return `/homes/${targetId}`;
  return itemType === "device" ? `/devices/${targetId}` : `/books/${targetId}`;
}

function friendlyFirestoreError(cause: unknown, fallback: string): Error {
  if (cause instanceof Error && cause.message && !("code" in cause)) return cause;
  return new Error(fallback);
}

/** Seller opens an auction (clears any previous standing) and sets the end time. */
export async function startAuction(input: {
  targetType: AuctionTargetType;
  targetId: string;
  sellerId: string;
  hours: number;
}): Promise<void> {
  if (!Number.isFinite(input.hours) || input.hours < 1 || input.hours > 168) {
    throw new Error("Pick an auction length between 1 hour and 7 days.");
  }
  try {
    const reference = doc(db, AUCTION_COLLECTION[input.targetType], input.targetId);
    await updateDoc(reference, {
      auction_started_at: Timestamp.now(),
      auction_ends_at: Timestamp.fromDate(new Date(Date.now() + input.hours * 3_600_000)),
      bid_count: 0,
      highest_bid: deleteField(),
      highest_bidder: deleteField(),
    });
  } catch (cause) {
    throw friendlyFirestoreError(cause, "Could not start the auction. Check your connection and try again.");
  }
}

/** Seller withdraws an auction that never received a bid (rules enforce zero bids). */
export async function cancelAuction(input: {
  targetType: AuctionTargetType;
  targetId: string;
}): Promise<void> {
  try {
    const reference = doc(db, AUCTION_COLLECTION[input.targetType], input.targetId);
    await updateDoc(reference, {
      auction_started_at: deleteField(),
      auction_ends_at: deleteField(),
      bid_count: deleteField(),
      highest_bid: deleteField(),
      highest_bidder: deleteField(),
    });
  } catch (cause) {
    throw friendlyFirestoreError(cause, "Could not remove the auction. Check your connection and try again.");
  }
}

/**
 * Place (or raise) a bid in a single transaction: bid document + listing
 * standing move together, so the board can never disagree with the bids.
 * Throws a friendly Error for pre-check failures; Firestore errors keep
 * their `code` so callers can map permission failures.
 */
export async function placeBid(input: {
  targetType: AuctionTargetType;
  targetId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
}): Promise<{ sellerId: string; title: string; previousTop: string | null }> {
  const amount = Math.round(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter a valid bid amount.");
  }

  const listingRef = doc(db, AUCTION_COLLECTION[input.targetType], input.targetId);
  const bidRef = doc(collection(db, "bids"), `${input.targetType}_${input.targetId}_${input.bidderId}`);
  const nowIso = new Date().toISOString();

  const result = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(listingRef);
    if (!snapshot.exists()) throw new Error("This listing is no longer available.");
    const listing = snapshot.data();

    if (String(listing.status ?? "available") !== "available") {
      throw new Error("This listing is no longer available.");
    }
    const endsMs = toMs(listing.auction_ends_at);
    if (endsMs === null) throw new Error("This listing is not up for auction.");
    if (Date.now() >= endsMs) throw new Error("The auction has ended.");

    const sellerId = String(listing.seller_id ?? listing.owner_id ?? "");
    if (sellerId === input.bidderId) throw new Error("You can't bid on your own listing.");

    const price = Number(listing.price ?? 0);
    const top = Number(listing.highest_bid ?? 0);
    if (amount < price) {
      throw new Error(`Bids start at the list price of ₹${price.toLocaleString("en-IN")}.`);
    }
    if (top > 0 && amount <= top) {
      const minimum = top + Math.max(50, Math.ceil(top * 0.05));
      throw new Error(
        `Beat the current bid of ₹${top.toLocaleString("en-IN")} — bid at least ₹${minimum.toLocaleString("en-IN")}.`,
      );
    }

    const title = String(listing.title ?? "this listing");
    const itemType = listing.item_type ? String(listing.item_type) : undefined;
    const previousTop = listing.highest_bidder ? String(listing.highest_bidder) : null;

    const bidSnapshot = await transaction.get(bidRef);
    if (bidSnapshot.exists()) {
      transaction.update(bidRef, { amount, updated_at: nowIso });
    } else {
      transaction.set(bidRef, {
        target_type: input.targetType,
        target_id: input.targetId,
        bidder_id: input.bidderId,
        bidder_name: input.bidderName.slice(0, 120),
        seller_id: sellerId,
        amount,
        created_at: nowIso,
        updated_at: nowIso,
      } satisfies DocumentData);
    }
    transaction.update(listingRef, {
      highest_bid: amount,
      highest_bidder: input.bidderId,
      bid_count: Number(listing.bid_count ?? 0) + 1,
    });

    return { sellerId, title, itemType, previousTop };
  });

  // Fire-and-forget: notifications must never fail the bid itself.
  const deepLink = deepLinkFor(input.targetType, input.targetId, result.itemType);
  if (result.previousTop && result.previousTop !== input.bidderId) {
    void createNotification({
      profileId: result.previousTop,
      type: "bid",
      title: "You've been outbid!",
      body: `${result.title} — the new highest bid is ₹${amount.toLocaleString("en-IN")}.`,
      targetId: deepLink,
    });
  }
  if (result.sellerId && result.sellerId !== input.bidderId) {
    void createNotification({
      profileId: result.sellerId,
      type: "bid",
      title: `New bid on ${result.title}`,
      body: `₹${amount.toLocaleString("en-IN")} from ${input.bidderName || "a buyer"} is now the highest bid.`,
      targetId: deepLink,
    });
  }
  return { sellerId: result.sellerId, title: result.title, previousTop: result.previousTop };
}

/** Seller accepts the top bid: marks the listing sold and notifies the winner. */
export async function sellToHighestBidder(input: {
  targetType: AuctionTargetType;
  targetId: string;
  sellerId: string;
  winnerId: string;
  amount: number;
  title: string;
}): Promise<void> {
  if (!input.winnerId) throw new Error("There are no bids on this listing.");
  try {
    if (input.targetType === "listing") {
      await markListingSold(input.targetId, input.sellerId, "sold");
    } else {
      await setHomeListingStatus(input.targetId, input.sellerId, "sold");
    }
  } catch (cause) {
    throw friendlyFirestoreError(cause, "Could not mark the listing sold. Please try again.");
  }

  void createNotification({
    profileId: input.winnerId,
    type: "bid",
    title: "You won the auction! 🎉",
    body: `${input.title} — your bid of ₹${input.amount.toLocaleString("en-IN")} won. Coordinate the handover with the seller.`,
    targetId: deepLinkFor(input.targetType, input.targetId),
  });
}
