/**
 * Listing expiry (read-time computed).
 *
 * Listings never get a status write for ageing — expiry is derived from
 * `created_at` on every read, so there is no background job to run and no
 * race between a "renew" and an expiry sweep. A seller renews by bumping
 * `created_at` (allowed by the owner-scoped update rule).
 *
 * Sample fixtures (`isSampleListing`) never expire: they are permanent demo
 * content and would otherwise start disappearing as the seed dates age.
 */

import { isSampleListing } from "@/lib/listingUtils";
import type { Listing, ListingStatus } from "@/lib/types";

export const ITEM_EXPIRY_DAYS = 45;
export const HOME_EXPIRY_DAYS = 60;

export type EffectiveItemStatus = ListingStatus | "expired";

/** True when `createdAt` is more than `days` old (or unparsable input is given). */
export function isExpired(createdAt: string | undefined, days: number): boolean {
  if (!createdAt) return false;
  const created = Date.parse(createdAt);
  if (Number.isNaN(created)) return false;
  return Date.now() - created > days * 24 * 60 * 60 * 1000;
}

/**
 * Effective status of an item listing for display and gating.
 * Returns "expired" only for available, non-sample listings past the window.
 */
export function effectiveItemStatus(listing: Listing): EffectiveItemStatus {
  if (listing.status !== "available") return listing.status;
  if (isSampleListing(listing)) return listing.status;
  return isExpired(listing.created_at, ITEM_EXPIRY_DAYS) ? "expired" : listing.status;
}

export function isItemExpired(listing: Listing): boolean {
  return effectiveItemStatus(listing) === "expired";
}

/** Effective status of a live home listing (sample homes never expire). */
export type HomeStatus = "available" | "rented" | "sold" | "withdrawn" | "expired";

export function effectiveHomeStatus(
  home: { created_at: string; status?: string } | null,
): HomeStatus | null {
  if (!home) return null;
  const status = (home.status as HomeStatus | undefined) ?? "available";
  if (status !== "available") return status;
  return isExpired(home.created_at, HOME_EXPIRY_DAYS) ? "expired" : "available";
}
