/**
 * Auction helpers (shared by seller dashboards and listing pages).
 *
 * Firestore stores `auction_started_at` / `auction_ends_at` as Timestamps so
 * the security rules can compare them against `request.time` (bids are only
 * accepted while the countdown is running). Anything crossing the React
 * server -> client boundary carries epoch milliseconds instead (see `mapDoc`
 * in `src/lib/firebase/firestore.ts`), so `toMs` accepts either shape.
 *
 * Invariants mirrored by firestore.rules:
 *  - one open auction per listing, end time in the future and <= 7 days out;
 *  - every bid must beat the current top server-side (monotonic standing);
 *  - bids cannot be retracted; cancelling an auction requires zero bids.
 */

/** Lifecycle of a listing's auction, derived from `auction_ends_at`. */
export type AuctionPhase = "none" | "live" | "ended";

/** The auction-shaped subset of a listing document. */
export interface AuctionFields {
  auction_ends_at?: unknown;
  auction_started_at?: unknown;
  highest_bid?: number;
  highest_bidder?: string;
  bid_count?: number;
}

/** Convert a Firestore Timestamp / epoch ms / Date into epoch ms, or null. */
export function toMs(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "object") {
    const candidate = value as { toMillis?: unknown };
    if (typeof candidate.toMillis === "function") {
      const ms = (candidate.toMillis as () => number)();
      return Number.isFinite(ms) ? ms : null;
    }
  }
  return null;
}

/** "none" (never auctioned) -> "live" (countdown running) -> "ended". */
export function auctionPhase(listing: AuctionFields, now = Date.now()): AuctionPhase {
  const ends = toMs(listing.auction_ends_at);
  if (ends === null) return "none";
  return now < ends ? "live" : "ended";
}

/**
 * Lowest bid accepted from the UI: an opening bid matches the list price;
 * every raise must beat the current top by at least ₹50 or 5%.
 */
export function minNextBid(highest: number | null | undefined, price: number): number {
  if (!highest || highest <= 0) return Math.max(1, Math.round(price));
  return highest + Math.max(50, Math.ceil(highest * 0.05));
}

/** Compact countdown: "2d 4h", "5h 12m", "45s". */
export function formatTimeLeft(endsMs: number, now = Date.now()): string {
  const diff = endsMs - now;
  if (diff <= 0) return "ended";
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor(totalSeconds / 3600) % 24;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/** Duration presets a seller picks from when starting an auction. */
export const AUCTION_DURATIONS: { hours: number; label: string }[] = [
  { hours: 24, label: "24 hours" },
  { hours: 48, label: "48 hours" },
  { hours: 168, label: "7 days" },
];

/** Sellers get a "start an auction?" nudge once this many buyers are interested. */
export const AUCTION_NUDGE_THRESHOLD = 3;
