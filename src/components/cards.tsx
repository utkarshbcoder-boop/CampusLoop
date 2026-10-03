import Link from "next/link";
import type { ReactNode } from "react";
import { SaveButton } from "@/components/Actions";
import { PinIcon, ClockIcon, StarIcon } from "@/components/Icon";
import { Avatar, ScoreBreakdown, ScoreRing, StarRating, TagList, Thumbnail } from "@/components/ui";
import { formatDate, formatTime, relativeDay, rupees, rupeesShort, timeAgo, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  CampusEvent,
  CampusService,
  College,
  Equipment,
  Listing,
  MatchResult,
  PGListing,
  Profile,
  SkillProfile,
  TeammatePost,
} from "@/lib/types";

const shortCollege = (colleges: College[], id: string | null | undefined): string =>
  colleges.find((c) => c.id === id)?.short_name ?? "Campus";

/* ------------------------------------------------------------------ */
/* Books                                                               */
/* ------------------------------------------------------------------ */

export function ListingCard({ listing, colleges }: { listing: Listing; colleges: College[] }) {
  const discount = listing.mrp > 0 ? Math.round((1 - listing.price / listing.mrp) * 100) : 0;
  return (
    <article className="cl-panel cl-panel-hover group flex h-full flex-col overflow-hidden">
      <div className="flex items-start gap-3 p-4 pb-3">
        <Thumbnail hue={listing.hue} emoji={listing.emoji} label={listing.title} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="cl-line-clamp-2 text-sm leading-snug font-semibold text-white">
              <Link href={`/books/${listing.id}`} className="after:absolute after:inset-0">
                {listing.title}
              </Link>
            </h3>
          </div>
          <p className="mt-1 text-xs text-white/45">
            {listing.author} · {listing.edition}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 px-4">
        <span className="cl-chip cl-chip-brand">{titleCase(listing.kind)}</span>
        <span className="cl-chip">{titleCase(listing.condition)}</span>
        {listing.status !== "available" ? (
          <span className={cn("cl-chip", listing.status === "sold" ? "cl-chip-rose" : "cl-chip-flare")}>
            {titleCase(listing.status)}
          </span>
        ) : null}
        {listing.boosted ? <span className="cl-chip cl-chip-flare">★ Boosted</span> : null}
      </div>

      <p className="cl-line-clamp-2 px-4 pt-3 text-xs leading-relaxed text-white/50">{listing.description}</p>

      <div className="mt-auto space-y-2 p-4">
        <TagList tags={[listing.subject, listing.semester, ...listing.tags]} max={3} />
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-bold text-white">
              {rupees(listing.price)}
              {listing.rent_per_day ? (
                <span className="text-xs font-medium text-white/40"> /{rupees(listing.rent_per_day)}day</span>
              ) : null}
            </p>
            <p className="text-[11px] text-white/35">
              MRP {rupees(listing.mrp)}
              {discount > 0 ? (
                <span className="ml-1.5 font-semibold text-mint-400">{discount}% off</span>
              ) : null}
            </p>
          </div>
          <div className="text-right text-[11px] text-white/35">
            <p className="flex items-center justify-end gap-1">
              <PinIcon width={11} height={11} />
              {shortCollege(colleges, listing.college_id)}
            </p>
            <p>{timeAgo(listing.created_at)}</p>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2 border-t border-white/8 pt-3">
          <span className="flex items-center gap-1 text-[11px] text-white/40">
            <StarIcon width={11} height={11} /> {listing.saves} saved
          </span>
          <span className="ml-auto">
            <SaveButton id={listing.id} label="Save" className="px-2.5 py-1 text-xs" />
          </span>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Equipment                                                           */
/* ------------------------------------------------------------------ */

export function EquipmentCard({ item, colleges, owner }: { item: Equipment; colleges: College[]; owner?: Profile }) {
  return (
    <article className="cl-panel cl-panel-hover relative flex h-full flex-col overflow-hidden">
      <div className="relative">
        <Thumbnail hue={item.hue} emoji={item.emoji} size="lg" label={item.name} />
        <span className="absolute top-3 left-3 rounded-full bg-ink-950/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          {titleCase(item.category)}
        </span>
        {item.delivery_available ? (
          <span className="absolute top-3 right-3 rounded-full bg-mint-500/85 px-2.5 py-1 text-[10px] font-semibold text-ink-950">
            Delivers to hostel
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="cl-line-clamp-2 text-sm leading-snug font-semibold text-white">
          <Link href={`/equipment/${item.id}`} className="after:absolute after:inset-0">
            {item.name}
          </Link>
        </h3>
        <p className="mt-1 text-xs text-white/45">
          {item.brand} · {shortCollege(colleges, item.college_id)}
        </p>

        <ul className="mt-3 flex flex-col gap-1">
          {item.specs.slice(0, 3).map((spec) => (
            <li key={spec} className="flex items-start gap-1.5 text-[11px] text-white/50">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-400" aria-hidden />
              {spec}
            </li>
          ))}
        </ul>

        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/40">
          <ClockIcon width={12} height={12} />
          {item.availability}
        </p>

        <div className="mt-auto space-y-2.5 pt-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-lg font-bold text-white">
                {rupees(item.day_rate)}
                <span className="text-xs font-medium text-white/40"> /day</span>
              </p>
              <p className="text-[11px] text-white/35">
                {rupees(item.week_rate)}/week · {rupees(item.deposit)} deposit
              </p>
            </div>
            <StarRating rating={item.rating} count={item.rating_count} />
          </div>
          {owner ? (
            <div className="flex items-center gap-2 border-t border-white/8 pt-3 text-[11px] text-white/40">
              <Avatar initials={owner.initials} size={22} premium={owner.is_premium} />
              {owner.name} · {item.rentals_count} rentals
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* PG listings                                                         */
/* ------------------------------------------------------------------ */

export function PGCard({ pg, colleges }: { pg: PGListing; colleges: College[] }) {
  return (
    <article className="cl-panel cl-panel-hover relative flex h-full flex-col overflow-hidden">
      <div className="relative">
        <Thumbnail hue={pg.hue} emoji={pg.emoji} size="lg" label={pg.title} />
        <span className="absolute top-3 left-3 rounded-full bg-ink-950/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          {titleCase(pg.type)}
        </span>
        {pg.owner_is_alum ? (
          <span className="absolute top-3 right-3 rounded-full bg-mint-500/85 px-2.5 py-1 text-[10px] font-semibold text-ink-950">
            Alum owner
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="cl-line-clamp-2 text-sm leading-snug font-semibold text-white">
          <Link href={`/pg/${pg.id}`} className="after:absolute after:inset-0">
            {pg.title}
          </Link>
        </h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-white/45">
          <PinIcon width={12} height={12} />
          {pg.locality} · {pg.distance_km} km from {shortCollege(colleges, pg.college_id)}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="cl-chip">{pg.room_type}</span>
          <span className="cl-chip">{titleCase(pg.gender)} only</span>
          <span className="cl-chip">
            {pg.walk_minutes_to_campus} min walk
          </span>
          {pg.food !== "none" ? <span className="cl-chip cl-chip-mint">{titleCase(pg.food)}</span> : null}
        </div>

        <div className="mt-auto space-y-2.5 pt-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-lg font-bold text-white">
                {rupees(pg.rent)}
                <span className="text-xs font-medium text-white/40"> /month</span>
              </p>
              <p className="text-[11px] text-white/35">
                {rupees(pg.deposit)} deposit{pg.bills_included ? " · bills included" : " · bills extra"}
              </p>
            </div>
            <p className="text-right text-[11px] text-white/40">
              <span className="block font-semibold text-white/70">{pg.beds_available} free</span>
              available {relativeDay(pg.available_from)}
            </p>
          </div>
          <p className="border-t border-white/8 pt-3 text-[11px] text-white/40">
            {pg.saves} students saved this · {pg.photos_count} photos
          </p>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Teammate posts                                                      */
/* ------------------------------------------------------------------ */

export function TeammateCard({
  post,
  colleges,
  owner,
}: {
  post: TeammatePost;
  colleges: College[];
  owner?: Profile;
}) {
  const roles = post.roles_needed;
  const slotsLeft = Math.max(0, post.roles_needed.reduce((a, r) => a + r.count, 0) - post.filled_count);
  return (
    <article className="cl-panel cl-panel-hover relative flex h-full flex-col overflow-hidden p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="cl-chip cl-chip-brand">{titleCase(post.project_type)}</span>
          {post.hackathon_tier === "national" ? <span className="cl-chip cl-chip-flare">National</span> : null}
          {post.prize_pool > 0 ? (
            <span className="cl-chip cl-chip-mint">{rupeesShort(post.prize_pool)} prize</span>
          ) : null}
        </div>
        <span className="shrink-0 text-[11px] text-white/35">{timeAgo(post.created_at)}</span>
      </div>

      <h3 className="mt-3 cl-line-clamp-2 text-[15px] leading-snug font-semibold text-white">
        <Link href={`/teams/${post.id}`} className="after:absolute after:inset-0">
          {post.title}
        </Link>
      </h3>
      <p className="mt-1 text-xs text-white/45">
        {post.event_name} · {shortCollege(colleges, post.college_id)}
      </p>

      <p className="cl-line-clamp-3 mt-2.5 text-xs leading-relaxed text-white/50">{post.description}</p>

      <div className="mt-3 flex flex-col gap-1.5">
        {roles.map((role) => (
          <div key={role.role} className="flex items-center gap-2 text-[11px]">
            <span className="w-16 shrink-0 font-semibold text-white/65">{titleCase(role.role)}</span>
            <span className="flex min-w-0 flex-1 flex-wrap gap-1">
              {role.skills.slice(0, 3).map((s) => (
                <span key={s} className="cl-chip">
                  {s}
                </span>
              ))}
            </span>
            <span className="shrink-0 text-white/35">×{role.count}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-2.5 pt-4">
        <TagList tags={post.tags} max={4} />
        <div className="grid grid-cols-3 gap-2 border-t border-white/8 pt-3 text-center">
          <div>
            <p className="text-sm font-bold text-white">{slotsLeft}</p>
            <p className="text-[10px] text-white/40">spots left</p>
          </div>
          <div>
            <p className="text-sm font-bold text-white">{post.hours_per_week}h</p>
            <p className="text-[10px] text-white/40">per week</p>
          </div>
          <div>
            <p className="text-sm font-bold text-white">{post.applicants}</p>
            <p className="text-[10px] text-white/40">applied</p>
          </div>
        </div>
        {owner ? (
          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <Avatar initials={owner.initials} size={20} premium={owner.is_premium} />
            Posted by {owner.name} · {titleCase(owner.branch.split(",")[0])} Y{owner.year_of_study}
          </div>
        ) : null}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Skill exchange                                                      */
/* ------------------------------------------------------------------ */

export function SkillCard({
  skill,
  owner,
  colleges,
}: {
  skill: SkillProfile;
  owner?: Profile;
  colleges: College[];
}) {
  return (
    <article className="cl-panel cl-panel-hover relative flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <span className={cn("cl-chip", skill.kind === "teach" ? "cl-chip-mint" : "cl-chip-brand")}>
          {skill.kind === "teach" ? "Teaching" : "Learning"}
        </span>
        <div className="flex items-center gap-1" title={`Level ${skill.level} of 5`}>
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              className={cn("h-1.5 w-3 rounded-full", i < skill.level ? "bg-brand-400" : "bg-white/12")}
              aria-hidden
            />
          ))}
        </div>
      </div>

      <h3 className="mt-3 cl-line-clamp-2 text-[15px] leading-snug font-semibold text-white">
        <Link href={`/skills/${skill.id}`} className="after:absolute after:inset-0">
          {skill.title}
        </Link>
      </h3>
      <p className="mt-1 text-xs text-white/45">
        {titleCase(skill.category)} · {skill.duration_weeks} weeks · {titleCase(skill.mode)}
      </p>

      <p className="cl-line-clamp-3 mt-2.5 text-xs leading-relaxed text-white/50">{skill.description}</p>

      <div className="mt-3 flex flex-col gap-2">
        <div>
          <p className="text-[10px] tracking-wider text-white/35 uppercase">Offers</p>
          <TagList tags={skill.offering} max={4} tone="mint" />
        </div>
        <div>
          <p className="text-[10px] tracking-wider text-white/35 uppercase">Wants</p>
          <TagList tags={skill.seeking} max={4} />
        </div>
      </div>

      <div className="mt-auto space-y-2.5 pt-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-lg font-bold text-white">
              {skill.credit_rate}
              <span className="text-xs font-medium text-white/40"> credit/session</span>
            </p>
            <p className="text-[11px] text-white/35">
              {skill.credit_rate * skill.duration_weeks} credits total · {skill.slots.length} weekly slots
            </p>
          </div>
          <StarRating rating={skill.rating} count={skill.sessions_completed} />
        </div>
        {owner ? (
          <div className="flex items-center gap-2 border-t border-white/8 pt-3 text-[11px] text-white/40">
            <Avatar initials={owner.initials} size={22} premium={owner.is_premium} />
            {owner.name} · {shortCollege(colleges, owner.college_id)} · {owner.credits} credits
          </div>
        ) : null}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

export function EventCard({ event, colleges }: { event: CampusEvent; colleges: College[] }) {
  const fill = Math.round((event.rsvp_count / Math.max(event.capacity, 1)) * 100);
  return (
    <article className="cl-panel cl-panel-hover relative flex h-full flex-col overflow-hidden">
      <div className="relative">
        <Thumbnail hue={event.hue} emoji={event.emoji} size="lg" label={event.title} />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span className="rounded-full bg-ink-950/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            {formatDate(event.starts_at)} · {formatTime(event.starts_at)}
          </span>
          {event.featured ? (
            <span className="rounded-full bg-flare-400 px-2.5 py-0.5 text-[10px] font-bold text-ink-950">Featured</span>
          ) : null}
        </div>
        <span
          className={cn(
            "absolute top-3 right-3 rounded-full px-2.5 py-1 text-[11px] font-semibold",
            event.free ? "bg-mint-500/90 text-ink-950" : "bg-ink-950/80 text-white backdrop-blur-sm",
          )}
        >
          {event.free ? "Free" : rupees(event.price)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <span className="text-[11px] font-medium tracking-wide text-brand-300 uppercase">{event.club}</span>
        <h3 className="mt-1 cl-line-clamp-2 text-[15px] leading-snug font-semibold text-white">
          <Link href={`/events/${event.id}`} className="after:absolute after:inset-0">
            {event.title}
          </Link>
        </h3>
        <p className="mt-1.5 flex items-center gap-1 text-xs text-white/45">
          <PinIcon width={12} height={12} />
          {event.is_online ? "Online + campus" : event.venue} · {shortCollege(colleges, event.college_id)}
        </p>

        <p className="cl-line-clamp-3 mt-2.5 text-xs leading-relaxed text-white/50">{event.description}</p>

        <p className="mt-3 rounded-lg border border-white/8 bg-white/3 px-2.5 py-1.5 text-[11px] leading-relaxed text-white/50">
          <span className="font-semibold text-brand-300">Why you: </span>
          {event.relevance_hint}
        </p>

        <div className="mt-auto space-y-2 pt-4">
          <div>
            <div className="flex items-baseline justify-between text-[11px]">
              <span className="text-white/45">
                {event.rsvp_count.toLocaleString("en-IN")} going
              </span>
              <span className="text-white/35">{fill}% full</span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/8">
              <div
                className={cn("h-full rounded-full", fill > 88 ? "bg-rose-400" : fill > 60 ? "bg-flare-400" : "bg-mint-400")}
                style={{ width: `${Math.min(100, fill)}%` }}
              />
            </div>
          </div>
          <TagList tags={event.tags} max={3} />
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Services                                                            */
/* ------------------------------------------------------------------ */

export function ServiceCard({ service, colleges }: { service: CampusService; colleges: College[] }) {
  return (
    <article className="cl-panel cl-panel-hover relative flex h-full flex-col p-4">
      <div className="flex items-start gap-3">
        <Thumbnail hue={service.hue} emoji={service.emoji} label={service.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="cl-chip cl-chip-brand">{titleCase(service.category)}</span>
            {service.verified ? <span className="cl-chip cl-chip-mint">✓ Verified</span> : null}
            {service.premium_only ? <span className="cl-chip cl-chip-flare">★ Premium</span> : null}
          </div>
          <h3 className="mt-1.5 cl-line-clamp-2 text-sm leading-snug font-semibold text-white">
            <Link href={`/services/${service.id}`} className="after:absolute after:inset-0">
              {service.name}
            </Link>
          </h3>
          <p className="mt-0.5 text-xs text-white/45">
            {service.provider_name} · {shortCollege(colleges, service.college_id)} · since {service.provider_since}
          </p>
        </div>
      </div>

      <p className="cl-line-clamp-3 mt-3 text-xs leading-relaxed text-white/50">{service.description}</p>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-white/4 px-2 py-2">
          <p className="text-sm font-bold text-white">{rupees(service.base_price)}</p>
          <p className="text-[10px] text-white/40">per {service.pricing_unit}</p>
        </div>
        <div className="rounded-lg bg-white/4 px-2 py-2">
          <p className="text-sm font-bold text-white">{service.turnaround_hours}h</p>
          <p className="text-[10px] text-white/40">turnaround</p>
        </div>
        <div className="rounded-lg bg-white/4 px-2 py-2">
          <p className="text-sm font-bold text-white">{service.jobs_completed.toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-white/40">jobs done</p>
        </div>
      </div>

      <div className="mt-auto space-y-2 pt-3">
        <p className="text-[11px] text-white/40">
          <span className="text-mint-400">Guarantee:</span> {service.guarantee}
        </p>
        <StarRating rating={service.rating} count={service.review_count} />
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Match result card — used across the Match Lab and detail pages       */
/* ------------------------------------------------------------------ */

export function MatchResultCard({
  result,
  rank,
  href,
  action,
  children,
}: {
  result: MatchResult<unknown>;
  rank: number;
  href: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <article className="cl-panel cl-panel-hover overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/8 text-xs font-bold text-white/70">
            {rank}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="cl-line-clamp-2 text-[15px] leading-snug font-semibold text-white">
              <Link href={href} className="hover:text-brand-200">
                {result.title}
              </Link>
            </h3>
            <p className="mt-1 text-xs text-white/45">{result.subtitle}</p>
            <p className="mt-2 text-xs leading-relaxed text-white/60">{result.headline}</p>
            {children}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 lg:flex-col lg:items-end lg:gap-2">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-3xl font-black tracking-tight text-white">{result.score}</p>
              <p className="text-[10px] tracking-wider text-white/35 uppercase">match score</p>
            </div>
            <ScoreRing score={result.score} />
          </div>
          {action}
        </div>
      </div>
      <div className="border-t border-white/8 bg-white/2 px-4 py-4 sm:px-5">
        <p className="mb-3 text-[10px] font-semibold tracking-wider text-white/35 uppercase">Score breakdown</p>
        <ScoreBreakdown breakdown={result.breakdown} />
      </div>
    </article>
  );
}
