import {
  collection,
  doc,
  runTransaction,
  setDoc,
  type DocumentData,
  type DocumentReference,
  type Timestamp,
  type Transaction,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type {
  BookCondition,
  DeviceCategory,
  Listing,
  ListingStatus,
  HomeListingMode,
  HomeListingType,
} from "@/lib/types";
import { db, getFirebaseStorage } from "./config";
import { createNotification } from "./notifications";

export type HomeListingStatus = "available" | "rented" | "sold" | "withdrawn";

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
  /** Lifecycle status allowed by firestore.rules; documents without it read as "available". */
  status?: HomeListingStatus;
  /** Shop sellers only: business name shown to buyers (see firestore.rules). */
  shop_name?: string;
  /** Shop sellers only: physical shop address shown to buyers. */
  shop_address?: string;
  /** Auction window (see src/lib/auction.ts): Timestamp in Firestore, epoch ms after the server data layer normalizes it. */
  auction_started_at?: number | Timestamp;
  auction_ends_at?: number | Timestamp;
  /** Server-enforced monotonic standing — every bid must beat this. */
  highest_bid?: number;
  highest_bidder?: string;
  bid_count?: number;
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

  let sellerToNotify: string | undefined;
  let listingTitle = "";

  const result: "created" | "exists" | "unavailable" | "own" = await runTransaction(
    db,
    async (transaction) => {
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
      sellerToNotify = String(listing.seller_id);
      listingTitle = String(listing.title ?? "");
      return "created";
    },
  );

  notifyOwnerOfInterest(result, sellerToNotify, listingTitle, listingId);
  return result;
}

export async function recordHomeListingInterest(
  listingId: string,
  buyerId: string,
): Promise<"created" | "exists" | "unavailable" | "own"> {
  const listingRef = doc(db, "home_listings", listingId);
  const interestRef = doc(db, "home_listing_interests", `${listingId}_${buyerId}`);

  let ownerToNotify: string | undefined;
  let listingTitle = "";

  const result: "created" | "exists" | "unavailable" | "own" = await runTransaction(
    db,
    async (transaction) => {
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
      ownerToNotify = String(listing.owner_id);
      listingTitle = String(listing.title ?? "");
      return "created";
    },
  );

  notifyOwnerOfInterest(result, ownerToNotify, listingTitle, listingId);
  return result;
}

/**
 * Fire-and-forget seller/owner notification after a successful interest
 * registration. `createNotification` never rejects; the extra `.catch` keeps
 * the interest action itself untouchable even so.
 */
function notifyOwnerOfInterest(
  result: "created" | "exists" | "unavailable" | "own",
  recipientId: string | undefined,
  title: string,
  targetId: string,
): void {
  if (result !== "created" || !recipientId) return;
  void createNotification({
    profileId: recipientId,
    type: "interest",
    title: title.slice(0, 120),
    body: "A student registered interest in your listing.",
    targetId,
  }).catch((cause: unknown) => {
    console.error("Failed to notify the listing owner about buyer interest:", cause);
  });
}

/* ------------------------------------------------------------------ */
/* Seller / owner self-service                                         */
/*                                                                     */
/* Every helper below runs inside a transaction that verifies ownership */
/* before writing, and only ever touches fields the firestore.rules    */
/* `affectedKeys().hasOnly(...)` allowlists permit.                    */
/* ------------------------------------------------------------------ */

/** Mutable listing fields — mirrors the `affectedKeys().hasOnly` list in firestore.rules. */
const MUTABLE_LISTING_KEYS = [
  "title", "author", "edition", "subject", "semester", "branch", "condition",
  "price", "mrp", "negotiable", "rent_per_day", "deposit", "pickup_location",
  "status", "description", "highlights", "tags", "hue", "emoji",
  "device_type", "image_urls", "created_at", "shop_name", "shop_address",
] as const;

/** Mutable home fields — mirrors the `affectedKeys().hasOnly` list in firestore.rules. */
const MUTABLE_HOME_KEYS = [
  "title", "locality", "price", "beds", "baths", "furnished", "distanceKm",
  "available", "owner", "description", "created_at", "status",
  "shop_name", "shop_address",
] as const;

const MAX_AMOUNT = 1_000_000_000;
const LISTING_STATUS_VALUES: readonly string[] = ["available", "reserved", "sold"];
const BOOK_CONDITION_VALUES: readonly string[] = ["like_new", "good", "fair", "heavy_notes"];
const DEVICE_TYPE_VALUES: readonly string[] = ["mobile", "laptop", "tablet", "other"];
const HOME_STATUS_VALUES: readonly string[] = ["available", "rented", "sold", "withdrawn"];
const FURNISHED_VALUES: readonly string[] = ["Full", "Semi", "Unfurnished"];

export interface MarketplaceListingPatch {
  title?: string;
  author?: string;
  edition?: string;
  subject?: string;
  semester?: string;
  branch?: string;
  condition?: BookCondition;
  price?: number;
  mrp?: number;
  negotiable?: boolean;
  rent_per_day?: number;
  deposit?: number;
  pickup_location?: string;
  status?: ListingStatus;
  description?: string;
  highlights?: string[];
  tags?: string[];
  hue?: number;
  emoji?: string;
  device_type?: DeviceCategory;
  image_urls?: string[];
  created_at?: string;
  shop_name?: string;
  shop_address?: string;
}

export interface HomeListingPatch {
  title?: string;
  locality?: string;
  price?: number;
  beds?: number;
  baths?: number;
  furnished?: "Full" | "Semi" | "Unfurnished";
  distanceKm?: number;
  available?: string;
  owner?: string;
  description?: string;
  status?: HomeListingStatus;
  created_at?: string;
  shop_name?: string;
  shop_address?: string;
}

function requireText(value: unknown, field: string): void {
  if (typeof value !== "string") throw new Error(`${field} must be text.`);
}

function requireLength(value: unknown, field: string, min: number, max: number): void {
  if (typeof value !== "string" || value.length < min || value.length > max) {
    throw new Error(`${field} must be between ${min} and ${max} characters.`);
  }
}

function requireMaxText(value: unknown, field: string, max: number): void {
  if (typeof value !== "string" || value.length > max) {
    throw new Error(`${field} must be at most ${max} characters.`);
  }
}

function requireAmount(value: unknown, field: string, min: number, max: number): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${field} must be a number between ${min} and ${max}.`);
  }
}

function requireChoice(value: unknown, field: string, allowed: readonly string[]): void {
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new Error(`${field} is not a valid option.`);
  }
}

function requireStringList(value: unknown, field: string): void {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`${field} must be a list of text values.`);
  }
}

function requireTimestamp(value: unknown, field: string): void {
  const parsed = typeof value === "string" ? Date.parse(value) : Number.NaN;
  if (Number.isNaN(parsed)) throw new Error(`${field} must be a valid date.`);
}

function sanitizeListingPatch(patch: MarketplaceListingPatch): DocumentData {
  const clean: DocumentData = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (!MUTABLE_LISTING_KEYS.includes(key as (typeof MUTABLE_LISTING_KEYS)[number])) {
      throw new Error(`"${key}" is read-only and cannot be edited.`);
    }
    clean[key] = value;
  }
  if ("title" in clean) requireLength(clean.title, "Title", 1, 300);
  if ("author" in clean) requireText(clean.author, "Author");
  if ("edition" in clean) requireText(clean.edition, "Edition");
  if ("subject" in clean) requireText(clean.subject, "Subject");
  if ("semester" in clean) requireText(clean.semester, "Semester");
  if ("branch" in clean) requireText(clean.branch, "Branch");
  if ("condition" in clean) requireChoice(clean.condition, "Condition", BOOK_CONDITION_VALUES);
  if ("price" in clean) requireAmount(clean.price, "Price", 1, MAX_AMOUNT);
  if ("mrp" in clean) requireAmount(clean.mrp, "MRP", 0, MAX_AMOUNT);
  if ("negotiable" in clean && typeof clean.negotiable !== "boolean") {
    throw new Error("Negotiable must be true or false.");
  }
  if ("rent_per_day" in clean) requireAmount(clean.rent_per_day, "Rent per day", 0, MAX_AMOUNT);
  if ("deposit" in clean) requireAmount(clean.deposit, "Deposit", 0, MAX_AMOUNT);
  if ("pickup_location" in clean) requireLength(clean.pickup_location, "Pickup location", 1, 500);
  if ("status" in clean) requireChoice(clean.status, "Status", LISTING_STATUS_VALUES);
  if ("description" in clean) requireMaxText(clean.description, "Description", 10_000);
  if ("highlights" in clean) requireStringList(clean.highlights, "Highlights");
  if ("tags" in clean) requireStringList(clean.tags, "Tags");
  if ("hue" in clean) requireAmount(clean.hue, "Hue", 0, 360);
  if ("emoji" in clean) requireText(clean.emoji, "Emoji");
  if ("device_type" in clean) requireChoice(clean.device_type, "Device type", DEVICE_TYPE_VALUES);
  if ("image_urls" in clean) {
    requireStringList(clean.image_urls, "Photos");
    if (Array.isArray(clean.image_urls) && clean.image_urls.length > 5) {
      throw new Error("You can keep up to 5 photos on a listing.");
    }
  }
  if ("created_at" in clean) requireTimestamp(clean.created_at, "Listed date");
  if ("shop_name" in clean) requireLength(clean.shop_name, "Shop name", 1, 120);
  if ("shop_address" in clean) requireLength(clean.shop_address, "Shop address", 1, 300);
  return clean;
}

function sanitizeHomePatch(patch: HomeListingPatch): DocumentData {
  const clean: DocumentData = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (!MUTABLE_HOME_KEYS.includes(key as (typeof MUTABLE_HOME_KEYS)[number])) {
      throw new Error(`"${key}" is read-only and cannot be edited.`);
    }
    clean[key] = value;
  }
  if ("title" in clean) requireLength(clean.title, "Title", 1, 300);
  if ("locality" in clean) requireLength(clean.locality, "Locality", 1, 300);
  if ("price" in clean) requireAmount(clean.price, "Price", 1, MAX_AMOUNT);
  if ("beds" in clean) requireAmount(clean.beds, "Bedrooms", 0, 100);
  if ("baths" in clean) requireAmount(clean.baths, "Bathrooms", 0, 100);
  if ("furnished" in clean) requireChoice(clean.furnished, "Furnishing", FURNISHED_VALUES);
  if ("distanceKm" in clean) requireAmount(clean.distanceKm, "Distance", 0, 1000);
  if ("available" in clean) requireText(clean.available, "Availability");
  if ("owner" in clean) requireText(clean.owner, "Listed by");
  if ("description" in clean) requireMaxText(clean.description, "Description", 2000);
  if ("status" in clean) requireChoice(clean.status, "Status", HOME_STATUS_VALUES);
  if ("created_at" in clean) requireTimestamp(clean.created_at, "Listed date");
  if ("shop_name" in clean) requireLength(clean.shop_name, "Shop name", 1, 120);
  if ("shop_address" in clean) requireLength(clean.shop_address, "Shop address", 1, 300);
  return clean;
}

async function requireListingOwner(
  transaction: Transaction,
  listingRef: DocumentReference<DocumentData>,
  sellerId: string,
  verb: "edit" | "delete",
): Promise<DocumentData> {
  const snapshot = await transaction.get(listingRef);
  if (!snapshot.exists()) throw new Error("This listing no longer exists.");
  const data = snapshot.data();
  if (data.seller_id !== sellerId) {
    throw new Error(`You can only ${verb} your own listings.`);
  }
  return data;
}

async function requireHomeOwner(
  transaction: Transaction,
  homeRef: DocumentReference<DocumentData>,
  ownerId: string,
  verb: "edit" | "delete",
): Promise<DocumentData> {
  const snapshot = await transaction.get(homeRef);
  if (!snapshot.exists()) throw new Error("This property listing no longer exists.");
  const data = snapshot.data();
  if (data.owner_id !== ownerId) {
    throw new Error(`You can only ${verb} your own home listings.`);
  }
  return data;
}

/** Best-effort reverse of an `uploadListingImages` download URL back to its storage path. */
function storagePathFromUrl(url: string): string | null {
  const start = url.indexOf("/o/");
  if (start === -1) return null;
  const encoded = url.slice(start + 3);
  const end = encoded.indexOf("?");
  try {
    return decodeURIComponent(end === -1 ? encoded : encoded.slice(0, end));
  } catch {
    return null;
  }
}

/** Update the editable fields of a listing the seller owns. */
export async function updateMarketplaceListing(
  listingId: string,
  sellerId: string,
  patch: MarketplaceListingPatch,
): Promise<void> {
  const update = sanitizeListingPatch(patch);
  if (Object.keys(update).length === 0) return;
  const listingRef = doc(db, "listings", listingId);
  await runTransaction(db, async (transaction) => {
    await requireListingOwner(transaction, listingRef, sellerId, "edit");
    transaction.update(listingRef, update);
  });
}

/** Delete a listing the seller owns, then best-effort remove its uploaded photos. */
export async function deleteMarketplaceListing(listingId: string, sellerId: string): Promise<void> {
  const listingRef = doc(db, "listings", listingId);
  const imageUrls: string[] = [];
  await runTransaction(db, async (transaction) => {
    const data = await requireListingOwner(transaction, listingRef, sellerId, "delete");
    if (Array.isArray(data.image_urls)) {
      imageUrls.push(
        ...data.image_urls.filter((url: unknown): url is string => typeof url === "string"),
      );
    }
    transaction.delete(listingRef);
  });
  const paths = imageUrls
    .map((url) => storagePathFromUrl(url))
    .filter((path): path is string => path !== null);
  if (paths.length > 0) {
    void deleteListingImages(paths).catch((cause: unknown) => {
      console.error("Listing deleted, but its photos could not be removed:", cause);
    });
  }
}

/** Flip only the status of a listing the seller owns. */
export async function markListingSold(
  listingId: string,
  sellerId: string,
  status: "reserved" | "sold" | "available",
): Promise<void> {
  requireChoice(status, "Status", LISTING_STATUS_VALUES);
  const listingRef = doc(db, "listings", listingId);
  await runTransaction(db, async (transaction) => {
    await requireListingOwner(transaction, listingRef, sellerId, "edit");
    transaction.update(listingRef, { status });
  });
}

/** Reset `created_at` so the read-time expiry window starts over (no status write). */
export async function renewListing(listingId: string, sellerId: string): Promise<void> {
  const listingRef = doc(db, "listings", listingId);
  await runTransaction(db, async (transaction) => {
    await requireListingOwner(transaction, listingRef, sellerId, "edit");
    transaction.update(listingRef, { created_at: new Date().toISOString() });
  });
}

/** Update the editable fields of a home listing the owner controls. */
export async function updateHomeListing(
  homeId: string,
  ownerId: string,
  patch: HomeListingPatch,
): Promise<void> {
  const update = sanitizeHomePatch(patch);
  if (Object.keys(update).length === 0) return;
  const homeRef = doc(db, "home_listings", homeId);
  await runTransaction(db, async (transaction) => {
    await requireHomeOwner(transaction, homeRef, ownerId, "edit");
    transaction.update(homeRef, update);
  });
}

/** Delete a home listing the owner controls. */
export async function deleteHomeListing(homeId: string, ownerId: string): Promise<void> {
  const homeRef = doc(db, "home_listings", homeId);
  await runTransaction(db, async (transaction) => {
    await requireHomeOwner(transaction, homeRef, ownerId, "delete");
    transaction.delete(homeRef);
  });
}

/** Flip only the status of a home listing the owner controls. */
export async function setHomeListingStatus(
  homeId: string,
  ownerId: string,
  status: HomeListingStatus,
): Promise<void> {
  requireChoice(status, "Status", HOME_STATUS_VALUES);
  const homeRef = doc(db, "home_listings", homeId);
  await runTransaction(db, async (transaction) => {
    await requireHomeOwner(transaction, homeRef, ownerId, "edit");
    transaction.update(homeRef, { status });
  });
}

/** Reset `created_at` so the read-time home expiry window starts over. */
export async function renewHomeListing(homeId: string, ownerId: string): Promise<void> {
  const homeRef = doc(db, "home_listings", homeId);
  await runTransaction(db, async (transaction) => {
    await requireHomeOwner(transaction, homeRef, ownerId, "edit");
    transaction.update(homeRef, { created_at: new Date().toISOString() });
  });
}
