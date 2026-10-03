import type { Metadata } from "next";
import Link from "next/link";
import { LaptopIcon, WrenchIcon } from "@/components/Icon";
import { ActiveFilters, FilterBar, type FilterDef } from "@/components/FilterBar";
import { EquipmentCard } from "@/components/cards";
import { EmptyState, PageHeader, Section } from "@/components/ui";
import { rupees } from "@/lib/format";
import { getColleges, getEquipment, parseEquipmentFilters, type SearchParams } from "@/lib/queries";
import { getDataProvider } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Equipment Rental",
  description:
    "Rent laptops, scientific calculators, lab gear, projectors and tools from students on your campus by the day. Verified owners, deposits held in escrow.",
};

const CATEGORIES = [
  { value: "all", label: "All equipment" },
  { value: "laptops", label: "Laptops & tablets" },
  { value: "calculators", label: "Calculators" },
  { value: "lab_equipment", label: "Lab equipment" },
  { value: "project_hardware", label: "Project hardware" },
  { value: "tools", label: "Tools" },
  { value: "audio_visual", label: "Audio & video" },
  { value: "sports", label: "Sports gear" },
];

const SORTS = [
  { value: "rate_asc", label: "Cheapest per day" },
  { value: "rate_desc", label: "Most expensive per day" },
  { value: "rating", label: "Highest rated" },
  { value: "popular", label: "Most rented" },
  { value: "newest", label: "Recently listed" },
];

export default async function EquipmentPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const filters = parseEquipmentFilters(params);
  const [items, colleges] = await Promise.all([getEquipment(filters), getColleges()]);

  // Owners come from the same provider, so the cards are real.
  const provider = await getDataProvider();
  const owners = await provider.profiles.list();
  const ownerById = new Map(owners.map((o) => [o.id, o]));

  const barFilters: FilterDef[] = [
    {
      kind: "select",
      key: "category",
      label: "Category",
      defaultValue: "all",
      options: CATEGORIES,
    },
    {
      kind: "range",
      key: "rate",
      label: "Max per day",
      min: 50,
      max: 1200,
      step: 25,
      defaultValue: 1200,
      format: "rupees" as const,
    },
    { kind: "select", key: "sort", label: "Sort by", defaultValue: "rate_asc", options: SORTS },
  ];

  const activeLabels = [
    filters.q ? { key: "q", label: `“${filters.q}”` } : null,
    filters.category !== "all"
      ? { key: "category", label: CATEGORIES.find((c) => c.value === filters.category)?.label ?? filters.category }
      : null,
    filters.maxDayRate ? { key: "rate", label: `under ${rupees(filters.maxDayRate)}/day` } : null,
  ].filter((x): x is { key: string; label: string } => Boolean(x));

  const totalRentals = items.reduce((a, i) => a + i.rentals_count, 0);

  return (
    <>
      <PageHeader
        eyebrow="Module 02 · Equipment rental"
        title="Use it once a semester. Don't buy it."
        description="A senior three blocks away already owns the lab calculator, the projector and the 16-inch laptop you need for one project. Rent by the day, pick up in person, deposit held in escrow."
      >
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{items.length}</p>
          <p className="text-[11px] text-white/45">items available</p>
        </div>
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{totalRentals}</p>
          <p className="text-[11px] text-white/45">successful rentals</p>
        </div>
      </PageHeader>

      <Section className="pt-6">
        <div className="flex flex-col gap-3">
          <FilterBar
            filters={barFilters}
            placeholder="Search “calculator”, “projector”, “MacBook”…"
            resultLabel={`${items.length} ${items.length === 1 ? "item" : "items"}`}
          />
          <ActiveFilters labels={activeLabels} />
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="Nothing matches that filter"
            description="Try raising the daily budget — most lab gear sits under ₹200 a day. If nobody on your campus owns it, list it yourself and become the first."
            action={
              <Link href="/equipment" className="cl-btn cl-btn-primary">
                Clear filters
              </Link>
            }
          />
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <EquipmentCard
                key={item.id}
                item={item}
                colleges={colleges}
                owner={ownerById.get(item.owner_id)}
              />
            ))}
          </div>
        )}

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="cl-panel flex items-center justify-between gap-3 p-5 lg:col-span-2">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-brand-300" aria-hidden>
                <LaptopIcon width={20} height={20} />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Done with the device itself?</p>
                <p className="mt-1 text-xs leading-relaxed text-white/55">
                  Skip renting out — sell it outright to a student on your campus.
                </p>
              </div>
            </div>
            <Link href="/sell?type=device" className="cl-btn cl-btn-primary shrink-0">
              Sell my device
            </Link>
          </div>
          <div className="cl-panel flex items-start gap-3 p-5">
            <span className="mt-0.5 text-brand-300" aria-hidden>
              <LaptopIcon width={20} height={20} />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Own gear that sits idle?</p>
              <p className="mt-1 text-xs leading-relaxed text-white/55">
                List a laptop, DSLR, calculator or drill. Set your own day rate and availability; CampusLoop handles the
                booking, the deposit and the handover confirmation. You earn roughly ₹8,000 a month from a laptop that
                would otherwise be under a bed.
              </p>
            </div>
          </div>
          <div className="cl-panel flex items-start gap-3 p-5">
            <span className="mt-0.5 text-brand-300" aria-hidden>
              <WrenchIcon width={20} height={20} />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">How the deposit works</p>
              <p className="mt-1 text-xs leading-relaxed text-white/55">
                The deposit is held in escrow, not handed to the owner. When you return the item and the owner confirms
                it in the app, the deposit is released — usually the same day. Disputes escalate to the college
                administration, which is the reason both sides accept the trade at all.
              </p>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
