import {
  collection,
  doc,
  runTransaction,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import type { Listing } from "@/lib/types";
import { db } from "./config";

export async function createMarketplaceListing(
  listing: Omit<Listing, "id">,
): Promise<string> {
  const reference = doc(collection(db, "listings"));
  await setDoc(reference, { ...listing, id: reference.id } satisfies DocumentData);
  return reference.id;
}

export async function recordListingInterest(
  listingId: string,
  buyerId: string,
): Promise<"created" | "exists" | "unavailable" | "own"> {
  const listingRef = doc(db, "listings", listingId);
  const interestRef = doc(db, "listing_interests", `${listingId}_${buyerId}`);

  return runTransaction(db, async (transaction) => {
    const listingSnapshot = await transaction.get(listingRef);
    if (!listingSnapshot.exists() || listingSnapshot.data().status !== "available") {
      return "unavailable";
    }

    const listing = listingSnapshot.data();
    if (listing.seller_id === buyerId) return "own";

    const interestSnapshot = await transaction.get(interestRef);
    if (interestSnapshot.exists()) return "exists";

    transaction.set(interestRef, {
      listing_id: listingId,
      buyer_id: buyerId,
      seller_id: listing.seller_id,
      created_at: new Date().toISOString(),
    });
    return "created";
  });
}
