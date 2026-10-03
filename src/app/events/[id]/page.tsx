import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon, PinIcon, ShieldIcon, SparkIcon, UsersIcon } from "@/components/Icon";
import { RsvpButton, SaveButton } from "@/components/Actions";
import { EventCard } from "@/components/cards";
import { EmptyState, KeyValue, Section, ScoreBreakdown, ScoreRing, TagList } from "@/components/ui";
import { formatDate, formatDateTime, formatTime, formatWeekday, rupees, titleCase } from "@/lib/format";
import { skillLabel } from "@/lib/data/taxonomy";
import { scoreEvent } from "@/lib/matching/engine";
import { getColleges, getCurrentProfile, getEvent, getEvents } from "@/lib/queries";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return { title: "Event not found" };
  return { title: event.title, description: event.description.slice(0, 155) };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, colleges, profile] = await Promise.all([getEvent(id), getColleges(), getCurrentProfile()]);
  if (!event) notFound();

  const college = colleges.find((c) => c.id === event.college_id);
  const match = scoreEvent(profile, event);
  const fill = Math.round((event.rsvp_count / Math.max(event.capacity, 1)) * 100);

  const related = (
    await getEvents({ q: "", category: event.category, audience: "all", price: "all", sort: "soonest" })
  )
    .filter((e) => e.id !== event.id)
    .slice(0, 3);

  return (
    <>
      <Section className="py-8">
        <nav className="mb-6 flex items-center gap-2 text-xs text-white/40" aria-label="Breadcrumb">
          <Link href="/events" className="transition hover:text-white">
            College events
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate text-white/70">{event.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col gap-4">
            <div className="cl-panel cl-panel-solid p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="cl-chip cl-chip-brand">{titleCase(event.category)}</span>
                <span className="cl-chip">{event.club}</span>
                {event.featured ? <span className="cl-chip cl-chip-flare">Featured</span> : null}
                <span className={event.free ? "cl-chip cl-chip-mint" : "cl-chip"}>
                  {event.free ? "Free entry" : rupees(event.price)}
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">{event.title}</h1>
              <p className="mt-2 text-sm text-white/55">Organised by {event.organizer}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                <RsvpButton eventId={event.id} eventTitle={event.title} price={event.price} free={event.free} />
                <SaveButton id={event.id} label="Save event" />
              </div>

              <p className="mt-4 text-sm leading-relaxed text-white/70">{event.description}</p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/8 bg-white/3 p-4">
                  <p className="text-[10px] tracking-wider text-white/40 uppercase">When</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {formatWeekday(event.starts_at)}, {formatDate(event.starts_at)}
                  </p>
                  <p className="mt-0.5 text-xs text-white/50">
                    {formatTime(event.starts_at)} – {formatTime(event.ends_at)}
                  </p>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/3 p-4">
                  <p className="text-[10px] tracking-wider text-white/40 uppercase">Where</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white">
                    <PinIcon width={13} height={13} />
                    {event.venue}
                  </p>
                  <p className="mt-0.5 text-xs text-white/50">
                    {event.is_online ? "Also streamed online" : "In person"} · {college?.short_name}
                  </p>
                </div>
              </div>

              {event.speakers.length > 0 ? (
                <div className="mt-5">
                  <h2 className="text-xs font-semibold tracking-wider text-white/45 uppercase">Speakers</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {event.speakers.map((s) => (
                      <span key={s} className="rounded-lg border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-white/75">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-5">
                <h2 className="text-xs font-semibold tracking-wider text-white/45 uppercase">Tags</h2>
                <div className="mt-2">
                  <TagList tags={event.tags} max={10} tone="flare" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="cl-panel cl-panel-solid p-5">
              <div className="flex items-start gap-4">
                <ScoreRing score={match.score} size={72} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">How relevant this is to you</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">{match.headline}</p>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-baseline justify-between text-[11px]">
                  <span className="text-white/45">
                    {event.rsvp_count.toLocaleString("en-IN")} going
                  </span>
                  <span className="text-white/35">
                    {event.capacity.toLocaleString("en-IN")} capacity · {fill}% full
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                  <div
                    className={`h-full rounded-full ${fill > 88 ? "bg-rose-400" : fill > 60 ? "bg-flare-400" : "bg-mint-400"}`}
                    style={{ width: `${Math.min(100, fill)}%` }}
                  />
                </div>
              </div>

              {fill > 80 ? (
                <p className="mt-3 text-[11px] leading-relaxed text-flare-300">
                  This is filling fast — {event.capacity - event.rsvp_count} spots left. Registering holds a seat for 30
                  minutes until you pay.
                </p>
              ) : null}

              <dl className="mt-4 grid grid-cols-2 gap-4">
                <KeyValue label="Entry" value={event.free ? "Free" : rupees(event.price)} />
                <KeyValue label="Mode" value={event.is_online ? "Online + campus" : "In person"} />
              </dl>
            </div>

            <div className="cl-panel p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                <SparkIcon width={15} height={15} className="text-brand-300" />
                Why this score
              </h2>
              <div className="mt-4">
                <ScoreBreakdown breakdown={match.breakdown} />
              </div>
            </div>

            <div className="cl-panel p-5">
              <h2 className="text-sm font-semibold text-white">Your skills vs the speakers</h2>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                Showing up to an event whose speakers work on things you already know is the highest-return hour you can
                spend this week.
              </p>
              <div className="mt-3">
                <TagList tags={profile.skills.map(skillLabel)} max={6} />
              </div>
            </div>

            <div className="cl-panel flex items-start gap-3 p-4">
              <ShieldIcon width={18} height={18} className="mt-0.5 shrink-0 text-mint-400" />
              <p className="text-[11px] leading-relaxed text-white/55">
                Organised by {event.organizer} and listed on CampusLoop since {formatDateTime(event.starts_at)}. Paid
                entries are refundable up to 24 hours before the start time.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {related.length > 0 ? (
        <Section className="border-t border-white/8 py-12">
          <h2 className="mb-6 text-xl font-bold text-white">More {titleCase(event.category)} events</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {related.map((e) => (
              <EventCard key={e.id} event={e} colleges={colleges} />
            ))}
          </div>
        </Section>
      ) : (
        <Section className="border-t border-white/8 py-12">
          <EmptyState
            title="Nothing else in this category"
            description="Event coverage is uneven across clubs — the popular organisers submit first. That gap is exactly why the college dashboard exists: club heads can publish directly instead of postering."
            action={
              <Link href="/events" className="cl-btn cl-btn-primary">
                <CheckIcon width={15} height={15} />
                Browse all events
              </Link>
            }
          />
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-white/35">
            <UsersIcon width={13} height={13} />
            Organisers: get your club listed from the college dashboard.
          </p>
        </Section>
      )}
    </>
  );
}