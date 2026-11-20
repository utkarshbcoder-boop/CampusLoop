"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { SaveButton } from "@/components/Actions";
import { MessageSellerButton } from "@/components/MessageSellerButton";
import { ReportButton } from "@/components/ReportButton";
import { ReviewsSection } from "@/components/ReviewsSection";
import { PinIcon } from "@/components/Icon";
import { db } from "@/lib/firebase/config";
import {
  recordHomeListingInterest,
  type HomeMarketplaceListing,
} from "@/lib/firebase/marketplace";
import { resendVerificationEmail } from "@/lib/firebase/auth";
import { HOME_TYPE_LABELS, type Home } from "@/lib/data/homes";
import { HOME_EXPIRY_DAYS, effectiveHomeStatus } from "@/lib/expiry";
import { rupees } from "@/lib/format";

export function HomeListingDetail({ id, sample }: { id: string; sample: Home | undefined }) {
  const { user } = useAuth();
  const router = useRouter();
  const [liveHome, setLiveHome] = useState<HomeMarketplaceListing | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let active = true;
    setLiveLoading(true);
    setLiveError(false);
    getDoc(doc(db, "home_listings", id))
      .then((snap) => {
        if (!active) return;
        setLiveHome(snap.exists() ? ({ id: snap.id, ...snap.data() } as HomeMarketplaceListing) : null);
        setLiveLoading(false);
      })
      .catch((cause) => {
        console.error(`Failed to load home listing ${id}:`, cause);
        if (!active) return;
        setLiveError(true);
        setLiveLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const listing = liveHome ?? sample;

  if (!listing) {
    return (
      <section className="mx-auto w-full max-w-4xl px-4 py-16">
        {liveLoading ? (
          <p className="text-sm text-white/55">Loading property details…</p>
        ) : liveError ? (
          <p role="alert" className="text-sm text-rose-300">Could not load property details. Please try again.</p>
        ) : (
          <div className="cl-panel p-6">
            <h1 className="text-xl font-bold text-white">Listing not found</h1>
            <Link href="/homes" className="cl-btn cl-btn-primary mt-4">Back to homes</Link>
          </div>
        )}
      </section>
    );
  }

  const liveListing = "owner_id" in listing && listing.owner_id ? listing : null;
  const isOwner = Boolean(liveListing && user?.uid === liveListing.owner_id);
  // Expiry is read-time for live homes only — sample fixtures never expire.
  const homeExpired = liveHome ? effectiveHomeStatus(liveHome) === "expired" : false;
  const shopName = liveListing?.shop_name?.trim() ?? "";
  const shopAddress = liveListing?.shop_address?.trim() ?? "";

  async function registerInterest() {
    if (!user) {
      router.push(`/login?returnTo=${encodeURIComponent(`/homes/${id}`)}`);
      return;
    }
    if (!user.emailVerified) {
      setMessage("Verify your email to register interest — check your inbox for the verification link.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await recordHomeListingInterest(id, user.uid);
      setMessage(
        result === "created"
          ? "Your interest was sent to the lister. Follow up with them to confirm details."
          : result === "exists"
            ? "You have already sent interest for this listing."
            : result === "own"
              ? "This is your own listing."
              : "This listing is no longer available.",
      );
    } catch (error) {
      console.error("Failed to register home listing interest:", error);
      setMessage("Could not send your interest. Please try again.");
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

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
      <nav className="mb-6 text-sm text-white/45" aria-label="Breadcrumb">
        <Link href="/homes" className="transition hover:text-white">Rooms, flats &amp; PGs</Link>
        <span className="mx-2" aria-hidden>/</span>
        <span className="text-white/70">{listing.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="cl-panel cl-panel-solid p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="cl-chip cl-chip-brand">{HOME_TYPE_LABELS[listing.type]}</span>
            <span className={`cl-chip ${listing.mode === "rent" ? "cl-chip-mint" : "cl-chip-flare"}`}>
              {listing.mode === "rent" ? "For rent" : "For sale"}
            </span>
            {shopName ? <span className="cl-chip">🏪 {shopName}</span> : null}
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-white">{listing.title}</h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-white/55">
            <PinIcon width={15} height={15} />
            {listing.locality}
            {listing.distanceKm > 0 ? ` · ${listing.distanceKm} km from campus` : ""}
          </p>
          <p className="mt-6 text-3xl font-black text-white">
            {rupees(listing.price)}
            {listing.mode === "rent" ? <span className="ml-1 text-sm font-medium text-white/45">/month</span> : null}
          </p>
          <div className="mt-7 grid grid-cols-2 gap-4 border-t border-white/8 pt-5">
            <Detail label="Bedrooms" value={String(listing.beds)} />
            <Detail label="Bathrooms" value={String(listing.baths)} />
            <Detail label="Furnishing" value={listing.furnished} />
            <Detail label="Available" value={listing.available} />
            <Detail label="Listed by" value={listing.owner} />
            {shopName ? <Detail label="Shop" value={shopName} /> : null}
            {shopAddress ? <Detail label="Shop address" value={shopAddress} /> : null}
          </div>
          {"description" in listing && typeof listing.description === "string" && listing.description ? (
            <div className="mt-7 border-t border-white/8 pt-5">
              <h2 className="text-sm font-semibold text-white">About this place</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/60">{listing.description}</p>
            </div>
          ) : null}
        </article>

        <aside className="cl-panel cl-panel-solid flex flex-col gap-4 p-6">
          <h2 className="text-lg font-bold text-white">Interested in this place?</h2>
          {liveListing ? (
            <button
              type="button"
              onClick={registerInterest}
              disabled={busy || Boolean(isOwner) || homeExpired}
              className="cl-btn cl-btn-primary justify-center disabled:opacity-50"
            >
              {busy ? "Sending…" : isOwner ? "Your listing" : homeExpired ? "Not available" : listing.mode === "sale" ? "I want to buy" : "I'm interested"}
            </button>
          ) : (
            <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-relaxed text-white/55">
              This is a sample listing. Interest requests are available on listings posted by their owners.
            </p>
          )}
          {homeExpired ? (
            <p role="status" className="text-xs leading-relaxed text-white/65">
              This listing expired after {HOME_EXPIRY_DAYS} days. Ask the lister to renew it.
            </p>
          ) : null}
          {message ? <p role="status" className="text-xs leading-relaxed text-white/65">{message}</p> : null}
          {liveListing && user && !user.emailVerified ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-relaxed text-white/55">
              <p>Verify your email to register interest in this listing.</p>
              <button
                type="button"
                onClick={resendVerification}
                disabled={resending}
                className="mt-2 text-brand-300 transition hover:text-brand-200 disabled:opacity-50"
              >
                {resending ? "Sending…" : "Resend verification email"}
              </button>
            </div>
          ) : null}
          {liveError ? <p role="alert" className="text-xs text-rose-300">Could not check live listing details.</p> : null}
          {liveListing ? (
            <>
              <div className="border-t border-white/8 pt-4">
                <MessageSellerButton
                  targetType="home"
                  targetId={id}
                  targetTitle={listing.title}
                  status="available"
                />
              </div>
              <ReportButton targetType="home" targetId={id} />
            </>
          ) : null}
          <div className="border-t border-white/8 pt-4">
            <SaveButton id={`home:${listing.id}`} label="Save this listing" className="w-full justify-center" />
          </div>
          <p className="text-xs leading-relaxed text-white/40">
            Confirm availability, ownership, and all terms directly with the lister. CampusLoop does not process payments.
          </p>
          <Link href="/homes" className="cl-btn cl-btn-ghost justify-center">Back to all homes</Link>
        </aside>
      </div>

      <div className="mt-8">
        <ReviewsSection
          targetType="home"
          targetId={id}
          sellerId={liveListing ? String(liveListing.owner_id) : ""}
          sample={!liveListing}
        />
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-1 text-sm font-medium text-white/80">{value}</p>
    </div>
  );
}
