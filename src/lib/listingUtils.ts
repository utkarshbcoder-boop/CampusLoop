import type { Listing } from "@/lib/types";

export function isSampleListing(listing: Listing): boolean {
  return listing.is_sample === true
    || /^lst_(?:\d{2}|device_|sample_book_)/.test(listing.id);
}
