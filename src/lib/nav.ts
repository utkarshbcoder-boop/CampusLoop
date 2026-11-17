/**
 * Navigation metadata for the marketplace's product areas.
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
    href: "/marketplace",
    label: "Second-hand items",
    short: "Items",
    emoji: "🛍️",
    blurb: "Browse used books, devices, and other pre-owned listings.",
    hook: "Find pre-owned items listed by students nearby.",
    action: "List an item",
  },
  {
    href: "/homes",
    label: "Rooms, Flats & PGs",
    short: "Homes",
    emoji: "🏘️",
    blurb: "Find rooms, flats, and PGs to rent or buy near your campus.",
    hook: "Find a place to live, or list your own.",
    action: "List a property",
  },
];

export const UTILITY_LINKS = [
  { href: "/messages", label: "Messages", emoji: "💬" },
  { href: "/my-listings", label: "My Listings", emoji: "📋" },
  { href: "/saved", label: "Saved", emoji: "⭐" },
  { href: "/settings", label: "Settings", emoji: "⚙️" },
];

export function moduleByHref(href: string): NavModule | undefined {
  return NAV_MODULES.find((m) => m.href === href);
}
