/**
 * Navigation metadata for the product modules.
 *
 * Lives in a plain module (not a `"use client"` component) so both the client
 * header and the server footer can import it.
 */

export interface NavModule {
  href: string;
  label: string;
  short: string;
  emoji: string;
  blurb: string;
  /** One-line pitch used on the landing page. */
  hook: string;
  /** What a student does here, in the language of the product. */
  action: string;
}

export const NAV_MODULES: NavModule[] = [
  {
    href: "/books",
    label: "Used Books",
    short: "Books",
    emoji: "📚",
    blurb: "Buy, sell and rent textbooks from the students already on your campus.",
    hook: "₹150 for a ₹900 book, from a hostel room 200 metres away.",
    action: "Sell a book",
  },
  {
    href: "/homes",
    label: "Homes & Rooms",
    short: "Homes",
    emoji: "🏘️",
    blurb: "Rent a room, PG or 1–4 BHK near campus, or buy a home.",
    hook: "A PG bed or a 2 BHK near your college, rent or buy.",
    action: "List a home",
  },
];

export const UTILITY_LINKS = [
  { href: "/college", label: "For Colleges", emoji: "🏛️" },
  { href: "/premium", label: "Premium", emoji: "⭐" },
  { href: "/settings", label: "Settings", emoji: "⚙️" },
];

export function moduleByHref(href: string): NavModule | undefined {
  return NAV_MODULES.find((m) => m.href === href);
}
