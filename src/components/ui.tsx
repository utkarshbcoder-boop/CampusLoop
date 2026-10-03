import Link from "next/link";
import type { ReactNode } from "react";
import { StarIcon } from "@/components/Icon";
import { cn } from "@/lib/utils";
import type { ScoreComponent } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20", className)}>
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between",
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <span className="cl-chip cl-chip-brand mb-3 inline-flex font-medium tracking-wide uppercase">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">{title}</h2>
        {description ? <p className="mt-3 text-sm leading-relaxed text-white/60 sm:text-base">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden border-b border-white/8">
      <div className="cl-grid-bg pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto w-full max-w-7xl px-4 pt-12 pb-10 sm:px-6 sm:pt-16 sm:pb-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="cl-chip cl-chip-brand mb-4 inline-flex font-medium tracking-wide uppercase">
              {eyebrow}
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">{description}</p>
          </div>
          {children ? <div className="flex shrink-0 flex-wrap gap-3">{children}</div> : null}
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

export function Stat({
  value,
  label,
  sublabel,
  icon,
  tone = "brand",
}: {
  value: string;
  label: string;
  sublabel?: string;
  icon?: ReactNode;
  tone?: "brand" | "flare" | "mint" | "rose";
}) {
  const tones = {
    brand: "text-brand-300",
    flare: "text-flare-300",
    mint: "text-mint-400",
    rose: "text-rose-400",
  } as const;
  return (
    <div className="cl-panel cl-panel-hover p-5">
      {icon ? <div className={cn("mb-3", tones[tone])}>{icon}</div> : null}
      <p className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{value}</p>
      <p className="mt-1 text-sm font-medium text-white/75">{label}</p>
      {sublabel ? <p className="mt-1 text-xs leading-relaxed text-white/45">{sublabel}</p> : null}
    </div>
  );
}

export function Thumbnail({
  hue,
  emoji,
  size = "md",
  label,
}: {
  hue: number;
  emoji: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const sizes = {
    sm: "h-11 w-11 text-lg rounded-lg",
    md: "h-14 w-14 text-2xl rounded-xl",
    lg: "h-full w-full text-6xl rounded-none",
  } as const;
  return (
    <div
      className={cn("relative flex shrink-0 items-center justify-center overflow-hidden", sizes[size])}
      style={{
        background: `linear-gradient(140deg, hsl(${hue} 62% 26%), hsl(${(hue + 40) % 360} 58% 14%))`,
      }}
      aria-label={label}
      role={label ? "img" : undefined}
    >
      <div
        className="absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            "radial-gradient(circle at 22% 18%, rgba(255,255,255,0.3), transparent 42%), repeating-linear-gradient(45deg, rgba(0,0,0,0.14) 0 6px, transparent 6px 12px)",
        }}
        aria-hidden
      />
      <span className="relative drop-shadow-lg" aria-hidden>
        {emoji}
      </span>
    </div>
  );
}

export function Avatar({
  initials,
  hue = 240,
  size = 40,
  premium = false,
}: {
  initials: string;
  hue?: number;
  size?: number;
  premium?: boolean;
}) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center rounded-full font-semibold text-white"
        style={{
          fontSize: size * 0.36,
          background: `linear-gradient(140deg, hsl(${hue} 62% 38%), hsl(${(hue + 55) % 360} 58% 22%))`,
        }}
      >
        {initials}
      </div>
      {premium ? (
        <span
          className="absolute -right-0.5 -bottom-0.5 rounded-full bg-flare-400 px-1 text-[9px] font-bold text-ink-950 ring-2 ring-ink-950"
          title="Premium member"
        >
          ★
        </span>
      ) : null}
    </div>
  );
}

export function StarRating({ rating, count, size = 13 }: { rating: number; count?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5" title={`${rating.toFixed(1)} out of 5`}>
      <span className="flex text-flare-400" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <StarIcon key={i} width={size} height={size} style={{ opacity: i < Math.round(rating) ? 1 : 0.25 }} />
        ))}
      </span>
      <span className="text-xs font-medium text-white/75">{rating.toFixed(1)}</span>
      {count !== undefined ? <span className="text-xs text-white/40">({count.toLocaleString("en-IN")})</span> : null}
    </span>
  );
}

export function KeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] font-medium tracking-wide text-white/40 uppercase">{label}</dt>
      <dd className="text-sm text-white/85">{value}</dd>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="cl-panel flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="text-3xl" aria-hidden>
        🗂️
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="max-w-md text-sm leading-relaxed text-white/50">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ProgressBar({ value, tone = "brand" }: { value: number; tone?: "brand" | "flare" | "mint" }) {
  const colors = {
    brand: "linear-gradient(90deg, #6366f1, #a855f7)",
    flare: "linear-gradient(90deg, #f59e0b, #fbbf24)",
    mint: "linear-gradient(90deg, #10b981, #34d399)",
  } as const;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: colors[tone] }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Match score visualisation — the AI engine made legible                */
/* ------------------------------------------------------------------ */

export function scoreTone(score: number): { text: string; ring: string; label: string } {
  if (score >= 85) return { text: "text-mint-400", ring: "stroke-mint-400", label: "Excellent" };
  if (score >= 70) return { text: "text-brand-300", ring: "stroke-brand-400", label: "Strong" };
  if (score >= 50) return { text: "text-flare-300", ring: "stroke-flare-400", label: "Decent" };
  return { text: "text-rose-400", ring: "stroke-rose-400", label: "Weak" };
}

export function ScoreRing({ score, size = 62 }: { score: number; size?: number }) {
  const tone = scoreTone(score);
  const stroke = size >= 56 ? 5 : 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={`currentColor`}
          className={tone.text}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold text-white", size >= 56 ? "text-base" : "text-xs")}>{score}</span>
        {size >= 72 ? <span className="text-[9px] text-white/40">score</span> : null}
      </div>
    </div>
  );
}

export function ScoreBreakdown({ breakdown }: { breakdown: ScoreComponent[] }) {
  if (breakdown.length === 0) {
    return <p className="text-sm text-white/45">No signals available for this match.</p>;
  }
  return (
    <div className="flex flex-col gap-3.5">
      {breakdown.map((b) => (
        <div key={b.key} className="group">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className="text-sm font-medium text-white/90">{b.label}</span>
            <span className="flex items-baseline gap-2 text-xs">
              <span className={cn("font-semibold", scoreTone(b.normalized).text)}>{b.normalized}/100</span>
              <span className="text-white/35">weight {(b.weight * 100).toFixed(0)}%</span>
              <span className="text-white/45">contributes {b.contribution.toFixed(1)} pts</span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.max(1.5, b.normalized)}%`,
                background:
                  b.normalized >= 80
                    ? "linear-gradient(90deg,#10b981,#34d399)"
                    : b.normalized >= 55
                      ? "linear-gradient(90deg,#6366f1,#a5b4fc)"
                      : "linear-gradient(90deg,#f59e0b,#fbbf24)",
              }}
            />
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-white/45">{b.detail}</p>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

export function TagList({
  tags,
  max = 6,
  tone = "brand",
}: {
  tags: string[];
  max?: number;
  tone?: "brand" | "plain" | "flare" | "mint";
}) {
  const toneClass =
    tone === "brand" ? "cl-chip cl-chip-brand" : tone === "flare" ? "cl-chip cl-chip-flare" : tone === "mint" ? "cl-chip cl-chip-mint" : "cl-chip";
  const shown = tags.slice(0, max);
  const rest = tags.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((tag) => (
        <span key={tag} className={toneClass}>
          {tag}
        </span>
      ))}
      {rest > 0 ? <span className="cl-chip">+{rest}</span> : null}
    </div>
  );
}

export function Callout({
  title,
  children,
  tone = "brand",
  icon,
}: {
  title: string;
  children: ReactNode;
  tone?: "brand" | "flare" | "mint";
  icon?: ReactNode;
}) {
  const tones = {
    brand: "border-brand-400/30 bg-brand-500/8",
    flare: "border-flare-400/30 bg-flare-500/8",
    mint: "border-mint-400/30 bg-mint-500/8",
  } as const;
  return (
    <div className={cn("rounded-xl border p-4 sm:p-5", tones[tone])}>
      <div className="flex items-start gap-3">
        {icon ? <div className="mt-0.5 shrink-0">{icon}</div> : null}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <div className="mt-1.5 text-sm leading-relaxed text-white/65">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function PrimaryLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("cl-btn cl-btn-primary", className)}>
      {children}
    </Link>
  );
}

export function GhostLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("cl-btn cl-btn-ghost", className)}>
      {children}
    </Link>
  );
}
