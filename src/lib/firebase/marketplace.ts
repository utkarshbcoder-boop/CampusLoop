import {
  collection,
  doc,
  runTransaction,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { Listing, HomeListingMode, HomeListingType } from "@/lib/types";
import { db, getFirebaseStorage } from "./config";

export interface HomeMarketplaceListing {
  id: string;
  title: string;
  locality: string;
  type: HomeListingType;
  mode: HomeListingMode;
  price: number;
  beds: number;
  baths: number;
  furnished: "Full" | "Semi" | "Unfurnished";
  distanceKm: number;
  available: string;
  owner: string;
  owner_id: string;
  description?: string;
  created_at: string;
}

export async function createMarketplaceListing(
  listing: Omit<Listing, "id">,
): Promise<string> {
  const reference = doc(collection(db, "listings"));
  await setDoc(reference, { ...listing, id: reference.id } satisfies DocumentData);
  return reference.id;
}

export async function uploadListingImages(
  files: File[],
  ownerId: string,
): Promise<{ urls: string[]; paths: string[] }> {
  const storage = getFirebaseStorage();
  const paths: string[] = [];
  const urls: string[] = [];
  try {
    for (const file of files) {
      const path = `listing-images/${ownerId}/${crypto.randomUUID()}`;
      const imageRef = ref(storage, path);
      await uploadBytes(imageRef, file, { contentType: file.type });
      paths.push(path);
      urls.push(await getDownloadURL(imageRef));
    }
    return { urls, paths };
  } catch (cause) {
    await Promise.allSettled(paths.map((path) => deleteObject(ref(storage, path))));
    throw cause;
  }
}

export async function deleteListingImages(paths: string[]): Promise<void> {
  const storage = getFirebaseStorage();
  await Promise.all(paths.map((path) => deleteObject(ref(storage, path))));
}

export async function createHomeMarketplaceListing(
  listing: Omit<HomeMarketplaceListing, "id">,
): Promise<string> {
  const reference = doc(collection(db, "home_listings"));
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

export async function recordHomeListingInterest(
  listingId: string,
  buyerId: string,
): Promise<"created" | "exists" | "unavailable" | "own"> {
  const listingRef = doc(db, "home_listings", listingId);
  const interestRef = doc(db, "home_listing_interests", `${listingId}_${buyerId}`);

  return runTransaction(db, async (transaction) => {
    const listingSnapshot = await transaction.get(listingRef);
    if (!listingSnapshot.exists()) return "unavailable";

    const listing = listingSnapshot.data();
    if (listing.owner_id === buyerId) return "own";

    const interestSnapshot = await transaction.get(interestRef);
    if (interestSnapshot.exists()) return "exists";

    transaction.set(interestRef, {
      home_listing_id: listingId,
      buyer_id: buyerId,
      owner_id: listing.owner_id,
      intent: listing.mode === "sale" ? "purchase" : "rental",
      created_at: new Date().toISOString(),
    });
    return "created";
  });
}
