import type { Metadata } from "next";
import Link from "next/link";
import { BookIcon, BoltIcon, FilterIcon } from "@/components/Icon";
import { ActiveFilters, FilterBar, type FilterDef } from "@/components/FilterBar";
import { ListingCard } from "@/components/cards";
import { EmptyState, GhostLink, PageHeader, Section } from "@/components/ui";
import { rupees } from "@/lib/format";
import { BOOK_SUBJECTS } from "@/lib/data/taxonomy";
import { getColleges, getListings, parseListingFilters, type SearchParams } from "@/lib/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Used Books Marketplace",
  description:
    "Buy, sell and rent textbooks from students on your own campus. Filter by subject, condition and price, with escrow-backed handover.",
};

const KINDS = [
  { value: "all", label: "Everything" },
  { value: "sell", label: "For sale" },
  { value: "rent", label: "For rent" },
];

const CONDITIONS = [
  { value: "all", label: "Any condition" },
  { value: "like_new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "heavy_notes", label: "Heavy notes" },
];

const SORTS = [
  { value: "recent", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "saved", label: "Most saved" },
  { value: "popular", label: "Most viewed" },
];

export default async function BooksPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const filters = parseListingFilters(params);
  const [listings, colleges] = await Promise.all([getListings(filters), getColleges()]);

  const barFilters: FilterDef[] = [
    { kind: "select", key: "kind", label: "Listing type", defaultValue: "all", options: KINDS },
    {
      kind: "select",
      key: "subject",
      label: "Subject",
      defaultValue: "all",
      options: [{ value: "all", label: "All subjects" }, ...BOOK_SUBJECTS.map((s) => ({ value: s, label: s }))],
    },
    { kind: "select", key: "condition", label: "Condition", defaultValue: "all", options: CONDITIONS },
    {
      kind: "select",
      key: "college",
      label: "Campus",
      defaultValue: "all",
      options: [{ value: "all", label: "All campuses" }, ...colleges.map((c) => ({ value: c.id, label: c.short_name }))],
    },
    {
      kind: "range",
      key: "maxprice",
      label: "Max price",
      min: 50,
      max: 2000,
      step: 50,
      defaultValue: 2000,
      format: "rupees" as const,
    },
    { kind: "select", key: "sort", label: "Sort by", defaultValue: "recent", options: SORTS },
  ];

  const activeLabels = [
    filters.q ? { key: "q", label: `“${filters.q}”` } : null,
    filters.kind !== "all" ? { key: "kind", label: KINDS.find((k) => k.value === filters.kind)?.label ?? filters.kind } : null,
    filters.subject !== "all" ? { key: "subject", label: filters.subject } : null,
    filters.condition !== "all"
      ? { key: "condition", label: CONDITIONS.find((c) => c.value === filters.condition)?.label ?? filters.condition }
      : null,
    filters.college ? { key: "college", label: colleges.find((c) => c.id === filters.college)?.short_name ?? "" } : null,
    filters.maxPrice ? { key: "maxprice", label: `under ${rupees(filters.maxPrice)}` } : null,
  ].filter((x): x is { key: string; label: string } => Boolean(x));

  const cheapest = listings.length ? Math.min(...listings.map((l) => l.price)) : 0;

  return (
    <>
      <PageHeader
        eyebrow="Module 01 · Used books"
        title="The ₹900 textbook you need, ₹180 from a senior in Block C"
        description="Every listing belongs to a verified student at a college on CampusLoop. Buy with escrow, rent by the week, and sell the semester's worth of notes in under a minute."
      >
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{listings.length}</p>
          <p className="text-[11px] text-white/45">live listings</p>
        </div>
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{cheapest ? rupees(cheapest) : "—"}</p>
          <p className="text-[11px] text-white/45">lowest price</p>
        </div>
      </PageHeader>

      <Section className="pt-6">
        <div className="flex flex-col gap-3">
          <FilterBar
            filters={barFilters}
            placeholder="Search a title, author or subject — try “Cormen” or “GATE”"
            resultLabel={`${listings.length} ${listings.length === 1 ? "result" : "results"}`}
          />
          <ActiveFilters labels={activeLabels} />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/40">
            {filters.maxPrice && filters.maxPrice < 2000 ? (
              <>
                Showing books under <span className="font-semibold text-white">{rupees(filters.maxPrice)}</span>
              </>
            ) : (
              "Drag the price slider to find your budget."
            )}
          </p>
          <GhostLink href="/match-lab" className="text-xs">
            <BoltIcon width={14} height={14} />
            Not sure what you need? Let the engine rank it
          </GhostLink>
        </div>

        {listings.length === 0 ? (
          <EmptyState
            title="No books match those filters"
            description="Try widening the price range or clearing the subject filter. The whole point is that a matching book exists on your campus — it may just be hidden behind a filter."
            action={
              <Link href="/books" className="cl-btn cl-btn-primary">
                <FilterIcon width={15} height={15} />
                Clear all filters
              </Link>
            }
          />
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} colleges={colleges} />
            ))}
          </div>
        )}

        <div className="mt-10 cl-panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-xl" aria-hidden>
              📚
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Finished with a semester?</p>
              <p className="mt-1 text-xs leading-relaxed text-white/55">
                List a book in under a minute. CampusLoop takes no listing fee — we earn a small commission only when it
                sells, and the buyer never pays extra.
              </p>
            </div>
          </div>
          <button type="button" className="cl-btn cl-btn-primary shrink-0">
            <BookIcon width={15} height={15} />
            Sell my books
          </button>
        </div>
      </Section>
    </>
  );
}
