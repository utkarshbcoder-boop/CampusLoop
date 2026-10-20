import type { Metadata } from "next";
import Link from "next/link";
import { BoltIcon, FilterIcon, LaptopIcon } from "@/components/Icon";
import { ActiveFilters, FilterBar, type FilterDef } from "@/components/FilterBar";
import { EquipmentCard } from "@/components/cards";
import { EmptyState, GhostLink, PageHeader, Section } from "@/components/ui";
import { EQUIPMENT_CATEGORIES } from "@/lib/data/equipmentCategories";
import { rupees } from "@/lib/format";
import { getColleges, getEquipment, parseEquipmentFilters, type SearchParams } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Campus Devices & Gear",
  description:
    "Find laptops, calculators, lab equipment, project hardware and more to rent from students on your campus.",
};

const SORTS = [
  { value: "rate_asc", label: "Rental price: low to high" },
  { value: "rate_desc", label: "Rental price: high to low" },
  { value: "rating", label: "Top rated" },
  { value: "popular", label: "Most rented" },
  { value: "newest", label: "Recently added" },
];

export default async function DevicesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const filters = parseEquipmentFilters(params);
  const [items, allItems, colleges] = await Promise.all([
    getEquipment(filters),
    getEquipment({ q: "", category: "all", college: "all", maxDayRate: null, sort: "rate_asc" }),
    getColleges(),
  ]);
  const cheapest = items.length ? Math.min(...items.map((item) => item.day_rate)) : 0;

  const barFilters: FilterDef[] = [
    {
      kind: "select",
      key: "category",
      label: "Category",
      defaultValue: "all",
      options: [
        { value: "all", label: "All devices & gear" },
        ...EQUIPMENT_CATEGORIES.map(({ value, label }) => ({ value, label })),
      ],
    },
    {
      kind: "select",
      key: "college",
      label: "Campus",
      defaultValue: "all",
      options: [
        { value: "all", label: "All campuses" },
        ...colleges.map((college) => ({ value: college.id, label: college.short_name })),
      ],
    },
    {
      kind: "range",
      key: "rate",
      label: "Max daily rental",
      min: 50,
      max: 1000,
      step: 50,
      defaultValue: 1000,
      format: "rupees",
    },
    { kind: "select", key: "sort", label: "Sort by", defaultValue: "rate_asc", options: SORTS },
  ];

  const activeLabels = [
    filters.q ? { key: "q", label: `“${filters.q}”` } : null,
    filters.category && filters.category !== "all"
      ? {
          key: "category",
          label: EQUIPMENT_CATEGORIES.find((category) => category.value === filters.category)?.label ?? filters.category,
        }
      : null,
    filters.college && filters.college !== "all"
      ? { key: "college", label: colleges.find((college) => college.id === filters.college)?.short_name ?? "" }
      : null,
    filters.maxDayRate ? { key: "rate", label: `under ${rupees(filters.maxDayRate)}/day` } : null,
  ].filter((item): item is { key: string; label: string } => Boolean(item));

  return (
    <>
      <PageHeader
        eyebrow="Module 02 · Devices & gear"
        title="Borrow the gear your next project needs"
        description="Browse student-listed laptops, calculators, lab equipment and more. Compare daily rates, availability and campus pickup details."
      >
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{items.length}</p>
          <p className="text-[11px] text-white/45">available listings</p>
        </div>
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{cheapest ? `${rupees(cheapest)}/day` : "—"}</p>
          <p className="text-[11px] text-white/45">lowest daily rate</p>
        </div>
      </PageHeader>

      <Section className="pt-6">
        <nav className="mb-5 flex gap-2" aria-label="Marketplace">
          <Link href="/books" className="cl-chip transition hover:text-white">📚 Used books</Link>
          <Link href="/devices" aria-current="page" className="cl-chip cl-chip-brand">💻 Devices & gear</Link>
        </nav>
        <nav className="mb-5 flex flex-wrap gap-2" aria-label="Device categories">
          <Link
            href="/devices"
            className={`cl-chip transition ${filters.category === "all" || !filters.category ? "cl-chip-brand" : "hover:text-white"}`}
          >
            All gear
          </Link>
          {EQUIPMENT_CATEGORIES.map((category) => {
            const count = allItems.filter((item) => item.category === category.value).length;
            const selected = filters.category === category.value;
            return (
              <Link
                key={category.value}
                href={`/devices?category=${category.value}`}
                aria-current={selected ? "page" : undefined}
                className={`cl-chip transition ${selected ? "cl-chip-brand" : "hover:text-white"}`}
              >
                <span aria-hidden>{category.emoji}</span>
                {category.label}
                <span className="text-white/35">{count}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-3">
          <FilterBar
            filters={barFilters}
            placeholder="Search laptops, calculators, cameras or lab gear"
            resultLabel={`${items.length} ${items.length === 1 ? "result" : "results"}`}
          />
          <ActiveFilters labels={activeLabels} />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/40">
            Rental rates are shown per day. Weekly pricing and refundable deposits are listed on each item.
          </p>
          <GhostLink href="/sell?type=device" className="text-xs">
            <BoltIcon width={14} height={14} />
            List your device or gear
          </GhostLink>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="No devices match those filters"
            description="Try another category, increase the daily rental limit or clear your search."
            action={
              <Link href="/devices" className="cl-btn cl-btn-primary">
                <FilterIcon width={15} height={15} />
                Clear all filters
              </Link>
            }
          />
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => (
              <EquipmentCard key={item.id} item={item} colleges={colleges} />
            ))}
          </div>
        )}

        <div className="mt-10 cl-panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-xl" aria-hidden>💻</span>
            <div>
              <p className="text-sm font-semibold text-white">Have gear sitting idle?</p>
              <p className="mt-1 text-xs leading-relaxed text-white/55">
                List laptops, calculators, cameras or lab equipment for other students to rent.
              </p>
            </div>
          </div>
          <Link href="/sell?type=device" className="cl-btn cl-btn-primary shrink-0">
            <LaptopIcon width={15} height={15} />
            List device or gear
          </Link>
        </div>
      </Section>
    </>
  );
}
