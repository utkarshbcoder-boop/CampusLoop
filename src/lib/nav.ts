/**
 * Navigation metadata for the nine product modules.
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
    href: "/equipment",
    label: "Equipment Rental",
    short: "Equipment",
    emoji: "💻",
    blurb: "Rent laptops, calculators and lab gear by the day instead of buying it.",
    hook: "A ₹1.2L laptop, ₹120 a day, from a senior in Block C.",
    action: "List equipment",
  },
  {
    href: "/pg",
    label: "PG & Roommate Finder",
    short: "PG & Rooms",
    emoji: "🏠",
    blurb: "Verified rooms near campus, matched on budget, commute and lifestyle.",
    hook: "Matched on budget, commute and sleep schedule — not just photos.",
    action: "List a room",
  },
  {
    href: "/teams",
    label: "Project Teammates",
    short: "Teammates",
    emoji: "🧑‍💻",
    blurb: "Skill-based matching so the hackathon team actually ships.",
    hook: "Find the backend person your hackathon team is missing.",
    action: "Post a team",
  },
  {
    href: "/skills",
    label: "Skills Exchange",
    short: "Skills",
    emoji: "🎯",
    blurb: "Time banking: teach what you know, learn what you need, pay in credits.",
    hook: "Trade an hour of Excel for an hour of React. Credits, not cash.",
    action: "Offer a skill",
  },
  {
    href: "/events",
    label: "College Events",
    short: "Events",
    emoji: "🎤",
    blurb: "Every fest, workshop and placement drive on one feed, ranked for you.",
    hook: "TechFest, hackathons and placement drives — one feed, ranked for you.",
    action: "Submit an event",
  },
  {
    href: "/services",
    label: "Verified Services",
    short: "Services",
    emoji: "🛠️",
    blurb: "Plumbers, electricians, laundry and printing — verified and bookable by slot.",
    hook: "A verified carpenter, booked for a 4pm slot, paid after the job.",
    action: "Register as a provider",
  },
  {
    href: "/opportunities",
    label: "Internships & More",
    short: "Opportunities",
    emoji: "💼",
    blurb: "Internships, hackathons, scholarships and part-time work, filtered to your CGPA.",
    hook: "Only the internships you actually qualify for.",
    action: "Post an opening",
  },
];

export const UTILITY_LINKS = [
  { href: "/match-lab", label: "AI Match Lab", emoji: "🤖" },
  { href: "/college", label: "For Colleges", emoji: "🏛️" },
  { href: "/premium", label: "Premium", emoji: "⭐" },
];

export function moduleByHref(href: string): NavModule | undefined {
  return NAV_MODULES.find((m) => m.href === href);
}