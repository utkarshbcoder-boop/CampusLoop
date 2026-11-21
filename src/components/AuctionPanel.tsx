"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase/config";
import { auctionPhase, formatTimeLeft, minNextBid, toMs } from "@/lib/auction";
import {
  cancelAuction,
  placeBid,
  sellToHighestBidder,
  type AuctionTargetType,
  type Bid,
} from "@/lib/firebase/auctions";
import { resendVerificationEmail } from "@/lib/firebase/auth";
import { rupees } from "@/lib/format";

/**
 * Live auction panel on a listing detail page (items and homes alike).
 *
 * Self-subscribes to the listing document so the countdown, standing and
 * bid form all update in realtime for every viewer — server pages hand it
 * nothing but primitives, which keeps Firestore Timestamps on this side of
 * the server -> client boundary. Renders nothing until the seller has
 * actually opened an auction.
 */
const FIREBASE_LIVE = process.env.NEXT_PUBLIC_USE_FIREBASE === "true";

interface ListingSnapshot {
  status?: string;
  price?: number;
  title?: string;
  seller_id?: string;
  owner_id?: string;
  item_type?: string;
  auction_started_at?: unknown;
  auction_ends_at?: unknown;
  highest_bid?: number;
  highest_bidder?: string;
  bid_count?: number;
}

export function AuctionPanel({
  targetType,
  targetId,
  sample = false,
}: {
  targetType: AuctionTargetType;
  targetId: string;
  /** Sample fixtures have no real seller or bids; never render. */
  sample?: boolean;
}) {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [listing, setListing] = useState<ListingSnapshot | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);

  const collectionName = targetType === "home" ? "home_listings" : "listings";

  // Watch the listing document (countdown + standing come straight from it).
  useEffect(() => {
    if (!FIREBASE_LIVE || sample) return;
    const unsubscribe = onSnapshot(
      doc(db, collectionName, targetId),
      (snapshot) => {
        setListing(snapshot.exists() ? (snapshot.data() as ListingSnapshot) : null);
      },
      (error) => {
        console.error(`Auction snapshot failed [${targetId}]:`, error);
        setListing(null);
      },
    );
    return () => unsubscribe();
  }, [collectionName, targetId, sample]);

  const endsMs = toMs(listing?.auction_ends_at);
  const hasAuction = endsMs !== null && listing !== null;
  const phase = listing ? auctionPhase(listing, now) : "none";

  // Standing board: every bid on this target (filtered to this target type
  // in case ids ever collide across collections), newest amount on top.
  useEffect(() => {
    if (!FIREBASE_LIVE || sample || !hasAuction) return;
    const unsubscribe = onSnapshot(
      query(collection(db, "bids"), where("target_id", "==", targetId)),
      (snapshot) => {
        setBids(
          snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }) as Bid)
            .filter((bid) => bid.target_type === targetType),
        );
      },
      (error) => {
        console.error(`Auction bids snapshot failed [${targetId}]:`, error);
      },
    );
    return () => unsubscribe();
  }, [targetType, targetId, sample, hasAuction]);

  // 1s heartbeat only while the countdown runs (phase flips when it hits 0).
  useEffect(() => {
    if (phase !== "live") return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [phase]);

  const price = Number(listing?.price ?? 0);
  const highest = Number(listing?.highest_bid ?? 0);
  const bidCount = Number(listing?.bid_count ?? 0);
  const status = String(listing?.status ?? "available");
  const title = String(listing?.title ?? "this listing");
  const sellerId = String(listing?.seller_id ?? listing?.owner_id ?? "");
  const highestBidder = listing?.highest_bidder ? String(listing.highest_bidder) : null;
  const minimum = minNextBid(highest > 0 ? highest : null, price);

  const isSeller = Boolean(user && sellerId && user.uid === sellerId);
  const isWinner = Boolean(user && highestBidder && user.uid === highestBidder);

  const board = useMemo(
    () => [...bids].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 5),
    [bids],
  );
  const leaderName =
    board.find((bid) => bid.bidder_id === highestBidder)?.bidder_name ?? "another buyer";

  // No auction opened, sample data, or Firestore disabled (e2e) -> nothing.
  if (!FIREBASE_LIVE || sample || !listing || phase === "none") return null;

  async function submitBid() {
    if (!user) {
      router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!user.emailVerified) {
      setMessage("Verify your email to bid — check your inbox for the verification link.");
      return;
    }
    const value = Math.round(Number(amount));
    if (!Number.isFinite(value) || value <= 0) {
      setMessage(`Enter a bid of at least ${rupees(minimum)}.`);
      return;
    }
    if (value < minimum) {
      setMessage(`The next bid must be at least ${rupees(minimum)}.`);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await placeBid({
        targetType,
        targetId,
        bidderId: user.uid,
        bidderName: profile?.name || user.displayName || "A buyer",
        amount: value,
      });
      setAmount("");
      setMessage(
        result.previousTop && result.previousTop !== user.uid
          ? `You're the highest bidder at ${rupees(value)}!`
          : `Bid placed — you're leading at ${rupees(value)}.`,
      );
    } catch (error) {
      console.error("Failed to place bid:", error);
      // Friendly errors carry a message without a Firestore `code`.
      setMessage(
        error instanceof Error && error.message && !("code" in error)
          ? error.message
          : "Could not place your bid. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    setResending(true);
    setMessage("");
    try {
      await resendVerificationEmail();
      setMessage("Verification email resent — check your inbox for the link.");
    } catch (error) {
      console.error("Failed to resend verification email:", error);
      setMessage("Could not resend the verification email. Please try again.");
    } finally {
      setResending(false);
    }
  }

  async function handleSell() {
    if (!user || !highestBidder) return;
    if (!window.confirm(`Sell ${title} to the highest bidder for ${rupees(highest)}?`)) return;
    setBusy(true);
    setMessage("");
    try {
      await sellToHighestBidder({
        targetType,
        targetId,
        sellerId,
        winnerId: highestBidder,
        amount: highest,
        title,
      });
      setMessage("Sold! The winner has been notified.");
    } catch (error) {
      console.error("Failed to sell to highest bidder:", error);
      setMessage(
        error instanceof Error && error.message && !("code" in error)
          ? error.message
          : "Could not complete the sale. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm("Remove this auction? It has no bids yet.")) return;
    setBusy(true);
    setMessage("");
    try {
      await cancelAuction({ targetType, targetId });
    } catch (error) {
      console.error("Failed to cancel auction:", error);
      setMessage(
        error instanceof Error && error.message && !("code" in error)
          ? error.message
          : "Could not remove the auction. Please try again.",
      );
      setBusy(false);
    }
    // On success the snapshot drops the auction fields and the panel hides itself.
  }

  const sold = status === "sold";

  return (
    <section aria-label="Auction" className="cl-panel mt-6 p-4 sm:p-5">
      {/* Header: live countdown / closed state */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={phase === "live" ? "cl-chip cl-chip-flare" : "cl-chip"}>
            {phase === "live" ? "🔨 Live auction" : "🔨 Auction closed"}
          </span>
          {phase === "live" ? (
            <span className="text-sm font-semibold text-white" aria-live="polite">
              {endsMs !== null ? formatTimeLeft(endsMs, now) : ""}
            </span>
          ) : null}
        </div>
        {endsMs !== null ? (
          <time className="text-xs text-white/50" dateTime={new Date(endsMs).toISOString()}>
            {phase === "live" ? "Ends " : "Ended "}
            {new Date(endsMs).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </time>
        ) : null}
      </header>

      {/* Standing */}
      <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {bidCount > 0 && highest > 0 ? (
          <>
            <p className="text-lg font-bold text-white">
              {rupees(highest)}{" "}
              <span className="text-xs font-medium text-white/50">
                highest bid · {bidCount} {bidCount === 1 ? "bid" : "bids"}
              </span>
            </p>
            {phase === "live" && !isSeller ? (
              <p className="text-xs text-white/55">
                Next bid: at least {rupees(minimum)}
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-lg font-bold text-white">
            {rupees(price)}{" "}
            <span className="text-xs font-medium text-white/50">
              {phase === "live" ? "opening bid · be the first" : "no bids"}
            </span>
          </p>
        )}
      </div>

      {/* Ended states */}
      {phase === "ended" ? (
        <div className="mt-3 space-y-3">
          {sold ? (
            <p className="text-sm text-white/70">
              🔨 Sold for {rupees(highest)} to {isWinner ? "you" : leaderName}.
            </p>
          ) : bidCount > 0 && highestBidder ? (
            <>
              <p className="text-sm text-white/70">
                Highest bid: {rupees(highest)} from {isWinner ? "you" : leaderName}.
              </p>
              {isSeller ? (
                <button
                  type="button"
                  onClick={handleSell}
                  disabled={busy}
                  className="cl-btn cl-btn-flare disabled:opacity-50"
                >
                  {busy ? "Working…" : `🎉 Sell to highest bidder (${rupees(highest)})`}
                </button>
              ) : isWinner ? (
                <p className="text-xs text-brand-300">
                  You&apos;re the winner — waiting for the seller to confirm the sale.
                </p>
              ) : (
                <p className="text-xs text-white/50">
                  Waiting for the seller to confirm the sale.
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-white/70">The auction ended with no bids.</p>
              {isSeller ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={busy}
                  className="cl-btn cl-btn-ghost disabled:opacity-50"
                >
                  {busy ? "Working…" : "Remove auction"}
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {/* Live: seller view */}
      {phase === "live" && isSeller ? (
        <p className="mt-3 text-sm text-white/70">
          Your auction is live — {bidCount} {bidCount === 1 ? "bid" : "bids"} so far.{" "}
          {bidCount === 0 ? "Bids close when the countdown ends." : ""}
        </p>
      ) : null}

      {/* Live: buyer bid form */}
      {phase === "live" && !isSeller ? (
        <div className="mt-3">
          {status !== "available" ? (
            <p className="text-sm text-white/70">This listing is no longer available.</p>
          ) : !user ? (
            <button
              type="button"
              onClick={() =>
                router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`)
              }
              className="cl-btn cl-btn-primary"
            >
              Sign in to bid
            </button>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={minimum}
                  step={1}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ""))}
                  placeholder={`₹${minimum.toLocaleString("en-IN")}`}
                  aria-label="Bid amount in rupees"
                  className="cl-input w-40"
                />
                <button
                  type="button"
                  onClick={submitBid}
                  disabled={busy}
                  className="cl-btn cl-btn-flare disabled:opacity-50"
                >
                  {busy ? "Placing…" : "Place bid"}
                </button>
              </div>
              {user && !user.emailVerified ? (
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/55">
                  <p>Verify your email to bid.</p>
                  <button
                    type="button"
                    onClick={resendVerification}
                    disabled={resending}
                    className="text-brand-300 transition hover:text-brand-200 disabled:opacity-50"
                  >
                    {resending ? "Sending…" : "Resend verification email"}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {/* Standing board */}
      {bidCount > 0 ? (
        <ol className="mt-4 space-y-1.5 border-t border-white/10 pt-3">
          {board.length === 0 ? (
            <li className="text-xs text-white/40">Loading bids…</li>
          ) : (
            board.map((bid, index) => (
              <li
                key={bid.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex items-center gap-2 truncate text-white/70">
                  <span className="w-5 shrink-0 text-xs text-white/40">#{index + 1}</span>
                  <span className="truncate">
                    {bid.bidder_name || "A buyer"}
                    {user && bid.bidder_id === user.uid ? (
                      <span className="ml-1.5 text-xs text-brand-300">(you)</span>
                    ) : null}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-white">
                  {rupees(Number(bid.amount))}
                </span>
              </li>
            ))
          )}
        </ol>
      ) : null}

      {message ? (
        <p role="status" className="mt-3 text-xs text-white/55">
          {message}
        </p>
      ) : null}
    </section>
  );
}
