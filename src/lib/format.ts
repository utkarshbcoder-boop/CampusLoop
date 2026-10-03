/** Formatting helpers. Indian locale first: ₹ + lakh/crore grouping. */

const inrCompact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrPlain = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

const numCompact = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function rupees(value: number): string {
  return inrCompact.format(value).replace("₹", "₹");
}

export function rupeesPlain(value: number): string {
  return inrPlain.format(value);
}

/** ₹1.2L / ₹45,000 — used where the number needs to be short. */
export function rupeesShort(value: number): string {
  if (Math.abs(value) >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(value % 100000 === 0 ? 0 : 1)}L`;
  if (Math.abs(value) >= 1000) return `₹${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 0)}k`;
  return `₹${value}`;
}

export function compactNumber(value: number): string {
  return numCompact.format(value);
}

export function inrToLpa(value: number): string {
  return `₹${(value / 100000).toFixed(1)}L`;
}

export function percent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

const DATE_FMT = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DATE_TIME_FMT = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const TIME_FMT = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const WEEKDAY_FMT = new Intl.DateTimeFormat("en-IN", { weekday: "short" });

export function formatDate(iso: string): string {
  return DATE_FMT.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return DATE_TIME_FMT.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return TIME_FMT.format(new Date(iso));
}

export function formatWeekday(iso: string): string {
  return WEEKDAY_FMT.format(new Date(iso));
}

export function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

/** "in 3 days" / "today" / "2 days ago" — relative to now. */
export function relativeDay(iso: string): string {
  const diff = daysUntil(iso);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff > 0) return `in ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function stars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return "★".repeat(full) + (half ? "½" : "");
}

export function titleCase(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
