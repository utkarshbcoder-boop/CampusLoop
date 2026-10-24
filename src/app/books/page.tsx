import type { Metadata } from "next";
import Link from "next/link";
import { BookIcon, FilterIcon } from "@/components/Icon";
import { ActiveFilters, FilterBar, type FilterDef } from "@/components/FilterBar";
import { ListingGrid } from "@/components/ListingGrid";
import { EmptyState, GhostLink, PageHeader, Section } from "@/components/ui";
import { rupees } from "@/lib/format";
import { BOOK_SUBJECTS } from "@/lib/data/taxonomy";
import { campusOptions } from "@/lib/data/campusOptions";
import { getBookListingsPage, getColleges, parseListingFilters, sp, type SearchParams } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Second-hand Books",
  description: "Browse pre-owned books listed by students and filter by subject, condition, and price.",
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
  const page = Number.parseInt(sp(params.page), 10);
  const [{ listings, hasMore, nextAfter, nextPage }, colleges] = await Promise.all([
    getBookListingsPage(filters, { after: sp(params.after), page: Number.isFinite(page) && page > 0 ? page : 1 }),
    getColleges(),
  ]);

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
      options: [{ value: "all", label: "All campuses" }, ...campusOptions.map((campus) => ({ value: campus.id, label: campus.short_name }))],
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
        eyebrow="Second-hand items · Books"
        title="Find a pre-owned book"
        description="Browse books listed by students. Check the details and arrange the handover directly with the seller."
      >
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{listings.length}</p>
          <p className="text-[11px] text-white/45">on this page</p>
        </div>
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{cheapest ? rupees(cheapest) : "—"}</p>
          <p className="text-[11px] text-white/45">lowest price</p>
        </div>
      </PageHeader>

      <Section className="pt-6">
        <nav className="mb-5 flex gap-2" aria-label="Marketplace">
          <Link href="/books" aria-current="page" className="cl-chip cl-chip-brand">📚 Used books</Link>
          <Link href="/marketplace" className="cl-chip transition hover:text-white">🛍️ All second-hand items</Link>
        </nav>
        <div className="flex flex-col gap-3">
          <FilterBar
            filters={barFilters}
            placeholder="Search a title, author or subject — try “Cormen” or “entrance exam”"
            resultLabel={`Showing ${listings.length}${hasMore ? "+" : ""} results`}
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
              "Adjust the price slider to find listings in your budget."
            )}
          </p>
          <GhostLink href="/sell?type=device" className="text-xs">
            Have a used device to sell?
          </GhostLink>
        </div>

        {listings.length === 0 ? (
          <EmptyState
            title="No books match those filters"
            description="Try widening the price range or clearing the subject filter."
            action={
              <Link href="/books" className="cl-btn cl-btn-primary">
                <FilterIcon width={15} height={15} />
                Clear all filters
              </Link>
            }
          />
        ) : (
          <ListingGrid listings={listings} colleges={colleges} />
        )}

        {hasMore ? (() => {
          const nextParams = new URLSearchParams();
          for (const [key, value] of Object.entries(params)) {
            if (key === "after" || key === "page") continue;
            for (const entry of Array.isArray(value) ? value : value ? [value] : []) {
              nextParams.append(key, entry);
            }
          }
          if (nextAfter) nextParams.set("after", nextAfter);
          else nextParams.set("page", String(nextPage));
          return (
            <nav className="mt-8 flex justify-center" aria-label="Book listing pages">
              <Link href={`/books?${nextParams.toString()}`} className="cl-btn cl-btn-ghost">
                Next page
              </Link>
            </nav>
          );
        })() : null}

        <div className="mt-10 cl-panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-xl" aria-hidden>
              📚
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Finished with a semester?</p>
              <p className="mt-1 text-xs leading-relaxed text-white/55">
                List a used book for students nearby to discover.
              </p>
            </div>
          </div>
          <Link href="/sell?type=book" className="cl-btn cl-btn-primary shrink-0">
            <BookIcon width={15} height={15} />
            Sell my books
          </Link>
        </div>
      </Section>
    </>
  );
}
