import type { DeviceCategory, Listing } from "@/lib/types";

export const DEVICE_CATEGORIES: { value: DeviceCategory; label: string }[] = [
  { value: "mobile", label: "Mobile phones" },
  { value: "laptop", label: "Laptops" },
  { value: "tablet", label: "Tablets" },
  { value: "other", label: "Other devices" },
];

export function getDeviceCategory(listing: Listing): DeviceCategory {
  if (listing.device_type) return listing.device_type;

  const text = `${listing.title} ${listing.edition} ${listing.subject}`.toLowerCase();
  if (/\b(tablet|ipad|galaxy tab)\b/.test(text)) return "tablet";
  if (/\b(laptop|notebook|macbook|chromebook)\b/.test(text)) return "laptop";
  if (/\b(mobile|phone|smartphone|iphone)\b/.test(text)) return "mobile";
  return "other";
}
