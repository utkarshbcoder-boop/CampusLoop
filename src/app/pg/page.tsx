import type { Metadata } from "next";
import Link from "next/link";
import { HomeIcon, SparkIcon } from "@/components/Icon";
import { ActiveFilters, FilterBar, type FilterDef } from "@/components/FilterBar";
import { PGCard } from "@/components/cards";
import { EmptyState, PageHeader, Section } from "@/components/ui";
import { rupees } from "@/lib/format";
import { getColleges, getPGListings, parsePGFilters, type SearchParams } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "PG & Roommate Finder",
  description:
    "Verified rooms and PG near your campus, matched on budget, commute and lifestyle. Not just photographs — an explainable roommate match score.",
};

const TYPES = [
  { value: "all", label: "All room types" },
  { value: "pg", label: "PG" },
  { value: "shared_flat", label: "Shared flat" },
  { value: "room_in_flat", label: "Room in a flat" },
  { value: "hostel_block", label: "Hostel block" },
];

const GENDERS = [
  { value: "all", label: "Any" },
  { value: "female", label: "Girls" },
  { value: "male", label: "Boys" },
];

const SORTS = [
  { value: "rent_asc", label: "Lowest rent" },
  { value: "rent_desc", label: "Highest rent" },
  { value: "distance", label: "Closest to campus" },
  { value: "popular", label: "Most saved" },
  { value: "newest", label: "Recently listed" },
];

export default async function PGPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const filters = parsePGFilters(params);
  const [rooms, colleges] = await Promise.all([getPGListings(filters), getColleges()]);

  const barFilters: FilterDef[] = [
    { kind: "select", key: "type", label: "Room type", defaultValue: "all", options: TYPES },
    { kind: "select", key: "gender", label: "For", defaultValue: "all", options: GENDERS },
    {
      kind: "range",
      key: "rent",
      label: "Max rent",
      min: 4000,
      max: 25000,
      step: 500,
      defaultValue: 25000,
      format: "rupeesPerMonth" as const,
    },
    {
      kind: "range",
      key: "distance",
      label: "Max distance",
      min: 1,
      max: 12,
      step: 1,
      defaultValue: 12,
      format: "km" as const,
    },
    { kind: "select", key: "sort", label: "Sort by", defaultValue: "rent_asc", options: SORTS },
  ];

  const activeLabels = [
    filters.q ? { key: "q", label: `“${filters.q}”` } : null,
    filters.type !== "all" ? { key: "type", label: TYPES.find((t) => t.value === filters.type)?.label ?? filters.type } : null,
    filters.gender !== "all" ? { key: "gender", label: GENDERS.find((g) => g.value === filters.gender)?.label ?? filters.gender } : null,
    filters.maxRent ? { key: "rent", label: `under ${rupees(filters.maxRent)}/mo` } : null,
    filters.maxDistance ? { key: "distance", label: `within ${filters.maxDistance} km` } : null,
  ].filter((x): x is { key: string; label: string } => Boolean(x));

  const beds = rooms.reduce((a, r) => a + r.beds_available, 0);
  const avgRent = rooms.length ? Math.round(rooms.reduce((a, r) => a + r.rent, 0) / rooms.length) : 0;

  return (
    <>
      <PageHeader
        eyebrow="Module 03 · PG & roommates"
        title="Matched on budget, commute and sleep schedule — not just photographs"
        description="Every room is a real listing near a real campus, and every roommate candidate is scored by the match engine on budget overlap, distance, lifestyle and reputation. You see the breakdown before you message anyone."
      >
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{beds}</p>
          <p className="text-[11px] text-white/45">beds available</p>
        </div>
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{avgRent ? rupees(avgRent) : "—"}</p>
          <p className="text-[11px] text-white/45">average monthly rent</p>
        </div>
      </PageHeader>

      <Section className="pt-6">
        <div className="flex flex-col gap-3">
          <FilterBar
            filters={barFilters}
            placeholder="Search a locality or college — “Koramangala”, “Hostel Road”…"
            resultLabel={`${rooms.length} ${rooms.length === 1 ? "room" : "rooms"}`}
          />
          <ActiveFilters labels={activeLabels} />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/40">
            Rooms are ranked by how well they fit a student looking for a place near{" "}
            {colleges[0]?.short_name}. Distance is measured gate-to-gate.
          </p>
          <Link href="/match-lab?domain=roommate" className="cl-btn cl-btn-primary">
            <SparkIcon width={15} height={15} />
            Score me a roommate instead
          </Link>
        </div>

        {rooms.length === 0 ? (
          <EmptyState
            title="No rooms match that budget"
            description="The rent slider goes up to ₹25,000 a month. If your budget is genuinely below ₹4,000 in this city, hostel-block listings are usually the answer — filter to “Hostel block” and try again."
            action={
              <Link href="/pg" className="cl-btn cl-btn-primary">
                <HomeIcon width={15} height={15} />
                Clear filters
              </Link>
            }
          />
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => (
              <PGCard key={room.id} pg={room} colleges={colleges} />
            ))}
          </div>
        )}

        <div className="mt-10 cl-panel p-5">
          <h2 className="text-sm font-semibold text-white">Why roommate matching, not just listings?</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            Most listing sites filter on rent and photos, which is why they hand you a room that is ₹2,000 over budget
            with someone who smokes. CampusLoop scores candidates against your own preferences — sleep schedule, food,
            cleanliness, budget band, college distance, availability and reputation — and shows you the weighted
            breakdown. Two students with identical budgets get different rankings, because they weight the signals
            differently.
          </p>
        </div>
      </Section>
    </>
  );
}
