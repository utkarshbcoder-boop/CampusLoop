"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { resendVerificationEmail } from "@/lib/firebase/auth";
import { createNotification } from "@/lib/firebase/notifications";
import {
  listReviewsForTarget,
  ratingSummary,
  submitReview,
  type Review,
  type ReviewTargetType,
} from "@/lib/firebase/reviews";
import { timeAgo } from "@/lib/format";
import { StarRating } from "@/components/ui";
import { ReportButton } from "@/components/ReportButton";

/**
 * Reviews & ratings block for a listing / home detail page (feature 8).
 *
 * Read-time computed: reviews are fetched once per target (no unbounded
 * listeners), the summary is derived client-side, and a reviewer can write
 * exactly one review (deterministic doc ID enforced by rules).
 */
export function ReviewsSection({
  targetType,
  targetId,
  sellerId,
  targetTitle = "",
  sample = false,
}: {
  targetType: ReviewTargetType;
  targetId: string;
  /** Listing seller / home owner being reviewed. */
  sellerId: string;
  /** Optional listing/home title — used in the seller's "new review" notification. */
  targetTitle?: string;
  /** Sample fixtures have no live document — rules would reject writes. */
  sample?: boolean;
}) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(!sample);
  const [stars, setStars] = useState<Review["stars"]>(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"neutral" | "success">("neutral");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (sample) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    listReviewsForTarget(targetType, targetId)
      .then((items) => {
        if (active) setReviews(items);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [targetType, targetId, sample]);

  const summary = ratingSummary(reviews);
  const myReview = user ? reviews.find((r) => r.reviewer_id === user.uid) : undefined;
  const isSeller = Boolean(user && sellerId && user.uid === sellerId);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setMessage("Sign in to leave a review.");
      return;
    }
    if (!user.emailVerified) {
      setTone("neutral");
      setMessage("Verify your email to leave a review — check your inbox for the link.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await submitReview({
        targetType,
        targetId,
        sellerId,
        reviewerId: user.uid,
        stars,
        comment,
      });
      if (result === "created") {
        setTone("success");
        setMessage("Thanks — your review is live.");
        setComment("");
        // Fire-and-forget: `createNotification` never throws, and a failed
        // notification must never break the review that triggered it.
        if (sellerId && sellerId !== user.uid) {
          void createNotification({
            profileId: sellerId,
            type: "review",
            title: targetTitle || "New review",
            body: `${stars}★ — ${comment.trim().slice(0, 200)}`,
            targetId,
          });
        }
        const items = await listReviewsForTarget(targetType, targetId);
        setReviews(items);
      } else if (result === "updated") {
        setTone("success");
        setMessage("Your review has been updated.");
        const items = await listReviewsForTarget(targetType, targetId);
        setReviews(items);
      } else {
        setTone("neutral");
        setMessage("You cannot review your own listing.");
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
      setTone("neutral");
      setMessage("Could not submit your review. Please try again.");
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

  if (sample) return null;

  return (
    <section aria-label="Reviews and ratings" className="cl-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Reviews &amp; rating</h2>
          <p className="mt-0.5 text-xs text-white/50">
            {summary
              ? `Based on ${summary.count} student ${summary.count === 1 ? "review" : "reviews"}.`
              : "No reviews yet — be the first to review this seller."}
          </p>
        </div>
        {summary ? (
          <span
            role="img"
            aria-label={`Average rating ${summary.average.toFixed(1)} out of 5 from ${summary.count} ${summary.count === 1 ? "review" : "reviews"}`}
          >
            <StarRating rating={summary.average} count={summary.count} size={15} />
          </span>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-4 text-xs text-white/45">Loading reviews…</p>
      ) : reviews.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StarRating rating={review.stars} size={12} />
                <span className="flex items-center gap-3">
                  <span className="text-[11px] text-white/35" suppressHydrationWarning>
                    {timeAgo(review.created_at)}
                  </span>
                  <ReportButton targetType="review" targetId={review.id} compact />
                </span>
              </div>
              {review.comment ? (
                <p className="mt-2 break-words text-xs leading-relaxed text-white/65">{review.comment}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {!isSeller ? (
        <form onSubmit={submit} className="mt-5 border-t border-white/8 pt-4">
          <h3 className="text-xs font-semibold text-white/80">
            {myReview ? "Update your review" : "Leave a review"}
          </h3>
          <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="Star rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={stars === value}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                onClick={() => setStars(value as Review["stars"])}
                className={`px-1 text-lg leading-none transition ${
                  value <= stars ? "text-flare-400" : "text-white/25 hover:text-white/50"
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="How was your experience with this seller? (optional)"
            className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 outline-none transition focus:border-brand-400/60"
          />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={busy} className="cl-btn cl-btn-primary px-4 py-2 text-xs disabled:opacity-50">
              {busy ? "Submitting…" : myReview ? "Update review" : "Submit review"}
            </button>
            {user && !user.emailVerified ? (
              <button
                type="button"
                onClick={resendVerification}
                disabled={resending}
                className="text-xs text-brand-300 transition hover:text-brand-200 disabled:opacity-50"
              >
                {resending ? "Sending…" : "Verify email to review"}
              </button>
            ) : null}
          </div>
        </form>
      ) : (
        <p className="mt-5 border-t border-white/8 pt-4 text-xs text-white/45">
          You cannot review your own listing.
        </p>
      )}

      {message ? (
        <p role="status" className={`mt-3 text-xs ${tone === "success" ? "text-mint-300" : "text-white/55"}`}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
