import type { Metadata } from "next";
import Link from "next/link";
import { ActiveFilters, FilterBar, type FilterDef } from "@/components/FilterBar";
import { EventCard } from "@/components/cards";
import { EmptyState, PageHeader, Section } from "@/components/ui";
import { formatDate, rupees } from "@/lib/format";
import { getColleges, getCurrentProfile, getEvents, parseEventFilters, type SearchParams } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "College Events",
  description:
    "TechFest, hackathons, workshops, placement drives and cultural nights across your campus — one feed, ranked by what you actually care about.",
};

const CATEGORIES = [
  { value: "all", label: "All events" },
  { value: "tech", label: "Tech" },
  { value: "cultural", label: "Cultural" },
  { value: "sports", label: "Sports" },
  { value: "workshop", label: "Workshops" },
  { value: "placement", label: "Placement drives" },
  { value: "social", label: "Social" },
  { value: "career", label: "Career" },
];

const AUDIENCE = [
  { value: "all", label: "Everywhere" },
  { value: "mine", label: "My campus only" },
];

const PRICE = [
  { value: "all", label: "Any price" },
  { value: "free", label: "Free only" },
];

const SORTS = [
  { value: "soonest", label: "Starting soonest" },
  { value: "popular", label: "Most RSVPs" },
  { value: "capacity", label: "Biggest events" },
];

export default async function EventsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const filters = parseEventFilters(params);
  const [events, colleges, profile] = await Promise.all([getEvents(filters), getColleges(), getCurrentProfile()]);

  const myCollege = colleges.find((c) => c.id === profile.college_id);
  const free = events.filter((e) => e.free).length;
  const rsvps = events.reduce((a, e) => a + e.rsvp_count, 0);

  const barFilters: FilterDef[] = [
    { kind: "select", key: "category", label: "Category", defaultValue: "all", options: CATEGORIES },
    { kind: "select", key: "price", label: "Entry", defaultValue: "all", options: PRICE },
    { kind: "select", key: "audience", label: "Audience", defaultValue: "all", options: AUDIENCE },
    { kind: "select", key: "sort", label: "Sort by", defaultValue: "soonest", options: SORTS },
  ];

  const activeLabels = [
    filters.q ? { key: "q", label: `“${filters.q}”` } : null,
    filters.category !== "all"
      ? { key: "category", label: CATEGORIES.find((c) => c.value === filters.category)?.label ?? filters.category }
      : null,
    filters.price === "free" ? { key: "price", label: "Free only" } : null,
    filters.audience === "mine" ? { key: "audience", label: `Only ${myCollege?.short_name}` } : null,
  ].filter((x): x is { key: string; label: string } => Boolean(x));

  const next = [...events].sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];

  return (
    <>
      <PageHeader
        eyebrow="Module 06 · Events"
        title="Every fest, workshop and placement drive on one feed"
        description="Club pages, poster walls and three different WhatsApp groups all carry event information, and none of it is searchable. CampusLoop puts it in one place and ranks it against your interests — so the workshop you would actually attend is at the top."
      >
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{events.length}</p>
          <p className="text-[11px] text-white/45">upcoming events</p>
        </div>
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{free}</p>
          <p className="text-[11px] text-white/45">free to attend</p>
        </div>
      </PageHeader>

      <Section className="pt-6">
        <div className="flex flex-col gap-3">
          <FilterBar
            filters={barFilters}
            placeholder="Search an event — “hackathon”, “TechFest”, “resume”…"
            resultLabel={`${events.length} ${events.length === 1 ? "event" : "events"}`}
          />
          <ActiveFilters labels={activeLabels} />
        </div>

        {next ? (
          <div className="mt-6 cl-panel cl-panel-solid flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="cl-chip cl-chip-flare shrink-0">Next up</span>
              <div>
                <p className="text-sm font-semibold text-white">{next.title}</p>
                <p className="mt-1 text-xs text-white/50">
                  {formatDate(next.starts_at)} · {next.venue} · {next.club}
                </p>
              </div>
            </div>
            <Link href={`/events/${next.id}`} className="cl-btn cl-btn-primary shrink-0">
              {next.free ? "RSVP free" : `Register ${rupees(next.price)}`}
            </Link>
          </div>
        ) : null}

        {events.length === 0 ? (
          <EmptyState
            title="No events match those filters"
            description={
              filters.audience === "mine"
                ? `Nothing is scheduled at ${myCollege?.short_name} yet. Switch to "Everywhere" to see events at the other campuses on the network.`
                : "Try switching to a different category, or clear the price filter."
            }
            action={
              <Link href="/events" className="cl-btn cl-btn-primary">
                Show all events
              </Link>
            }
          />
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} colleges={colleges} />
            ))}
          </div>
        )}

        <div className="mt-10 cl-panel p-5">
          <p className="text-xs text-white/45">
            {rsvps.toLocaleString("en-IN")} RSVPs recorded across these events. CampusLoop does not take a cut of club
            ticket revenue — events are a retention feature, not a revenue line. The money is in{" "}
            <Link href="/business" className="text-brand-300">
              sponsorship of the events themselves
            </Link>
            .
          </p>
        </div>
      </Section>
    </>
  );
}