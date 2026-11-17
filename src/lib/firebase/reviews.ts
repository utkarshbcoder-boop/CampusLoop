/**
 * Reviews & ratings (feature 8).
 *
 * Contract (must match firestore.rules):
 *  - Deterministic IDs `${targetType}_${targetId}_${reviewerId}` — one review
 *    per reviewer per target; the doc also carries its own `id` field.
 *  - No self-reviews (seller_id != reviewer_id, enforced by rules).
 *  - Star ratings are integers 1-5; comments capped at 1000 chars.
 *  - Queries are equality-only, sorted client-side (no composite indexes).
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  where,
} from "firebase/firestore";
import { db } from "./config";

export type ReviewTargetType = "listing" | "home";

export interface Review {
  id: string;
  target_type: ReviewTargetType;
  target_id: string;
  /** Listing seller / home owner the review is about. */
  seller_id: string;
  reviewer_id: string;
  stars: 1 | 2 | 3 | 4 | 5;
  comment: string;
  created_at: string;
}

export function reviewIdFor(
  targetType: ReviewTargetType,
  targetId: string,
  reviewerId: string,
): string {
  return `${targetType}_${targetId}_${reviewerId}`;
}

function sortNewestFirst(items: Review[]): Review[] {
  return items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

/** All reviews for one listing/home (newest first). */
export async function listReviewsForTarget(
  targetType: ReviewTargetType,
  targetId: string,
): Promise<Review[]> {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, "reviews"),
        where("target_type", "==", targetType),
        where("target_id", "==", targetId),
      ),
    );
    return sortNewestFirst(
      snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Review)),
    );
  } catch (cause) {
    console.error("listReviewsForTarget failed:", cause);
    return [];
  }
}

/** Every review written about a seller/owner (for their profile card). */
export async function listReviewsForSeller(sellerId: string): Promise<Review[]> {
  try {
    const snapshot = await getDocs(query(collection(db, "reviews"), where("seller_id", "==", sellerId)));
    return sortNewestFirst(
      snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Review)),
    );
  } catch (cause) {
    console.error("listReviewsForSeller failed:", cause);
    return [];
  }
}

export async function getMyReview(
  targetType: ReviewTargetType,
  targetId: string,
  reviewerId: string,
): Promise<Review | null> {
  try {
    const snapshot = await getDoc(
      doc(db, "reviews", reviewIdFor(targetType, targetId, reviewerId)),
    );
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Review) : null;
  } catch (cause) {
    console.error("getMyReview failed:", cause);
    return null;
  }
}

/**
 * Submit a review for a target (creates, or updates the reviewer's own —
 * the deterministic ID guarantees the existing doc is theirs).
 * "own" — you cannot review your own listing.
 */
export async function submitReview(input: {
  targetType: ReviewTargetType;
  targetId: string;
  sellerId: string;
  reviewerId: string;
  stars: Review["stars"];
  comment: string;
}): Promise<"created" | "updated" | "own"> {
  const { targetType, targetId, sellerId, reviewerId, stars, comment } = input;
  if (sellerId === reviewerId) return "own";
  const reviewId = reviewIdFor(targetType, targetId, reviewerId);
  const reviewRef = doc(db, "reviews", reviewId);
  const trimmed = comment.trim().slice(0, 1000);

  return runTransaction(db, async (transaction) => {
    const existing = await transaction.get(reviewRef);
    if (existing.exists()) {
      // Update rule only permits stars/comment changes by the reviewer.
      transaction.update(reviewRef, { stars, comment: trimmed });
      return "updated";
    }

    const now = new Date().toISOString();
    transaction.set(reviewRef, {
      id: reviewId,
      target_type: targetType,
      target_id: targetId,
      seller_id: sellerId,
      reviewer_id: reviewerId,
      stars,
      comment: trimmed,
      created_at: now,
    } satisfies Record<string, unknown>);
    return "created";
  });
}

/** Aggregate helper for the rating summary header. */
export function ratingSummary(
  reviews: Review[],
): { count: number; average: number } | null {
  if (reviews.length === 0) return null;
  const total = reviews.reduce((sum, review) => sum + review.stars, 0);
  return {
    count: reviews.length,
    average: Math.round((total / reviews.length) * 10) / 10,
  };
}
