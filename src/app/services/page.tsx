import type { Metadata } from "next";
import Link from "next/link";
import { ActiveFilters, FilterBar, type FilterDef } from "@/components/FilterBar";
import { ServiceCard } from "@/components/cards";
import { Callout, EmptyState, PageHeader, Section } from "@/components/ui";
import { ShieldIcon, WrenchIcon } from "@/components/Icon";
import { rupees } from "@/lib/format";
import { getBookingsFor, getColleges, getCurrentProfile, getServices, parseServiceFilters } from "@/lib/queries";
import type { SearchParams } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verified Campus Services",
  description:
    "Plumbers, electricians, laundry, printing, bike repair and pest control near your campus — ID-verified providers, fixed prices, bookable slots, pay after the job.",
};

const CATEGORIES = [
  { value: "all", label: "All services" },
  { value: "plumber", label: "Plumber" },
  { value: "electrician", label: "Electrician" },
  { value: "ac_service", label: "AC servicing" },
  { value: "laundry", label: "Laundry" },
  { value: "printing", label: "Printing" },
  { value: "bike_repair", label: "Bike repair" },
  { value: "electronics_repair", label: "Electronics repair" },
  { value: "catering", label: "Catering" },
  { value: "moving", label: "Moving help" },
  { value: "pest_control", label: "Pest control" },
  { value: "tutoring", label: "Tutoring" },
];

const PRICE = [
  { value: "", label: "Any price" },
  { value: "300", label: "Under ₹300" },
  { value: "500", label: "Under ₹500" },
  { value: "1000", label: "Under ₹1,000" },
];

const RATING = [
  { value: "", label: "Any rating" },
  { value: "4.5", label: "4.5★ and up" },
  { value: "4.7", label: "4.7★ and up" },
];

const SORTS = [
  { value: "rating", label: "Highest rated" },
  { value: "price_asc", label: "Cheapest first" },
  { value: "fastest", label: "Fastest turnaround" },
  { value: "popular", label: "Most booked" },
];

export default async function ServicesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const filters = parseServiceFilters(params);
  const [services, colleges, profile, bookings] = await Promise.all([
    getServices(filters),
    getColleges(),
    getCurrentProfile(),
    getBookingsFor(""),
  ]);

  const verified = services.filter((s) => s.verified).length;
  const cheapest = [...services].sort((a, b) => a.base_price - b.base_price)[0];
  const jobs = services.reduce((a, s) => a + s.jobs_completed, 0);
  const myBookings = bookings.filter((b) => b.student_id === profile.id);

  const barFilters: FilterDef[] = [
    { kind: "select", key: "category", label: "Service", defaultValue: "all", options: CATEGORIES },
    { kind: "select", key: "price", label: "Max price", defaultValue: "", options: PRICE },
    { kind: "select", key: "minrating", label: "Rating", defaultValue: "", options: RATING },
    { kind: "select", key: "sort", label: "Sort by", defaultValue: "rating", options: SORTS },
  ];

  const activeLabels = [
    filters.q ? { key: "q", label: `“${filters.q}”` } : null,
    filters.category !== "all"
      ? { key: "category", label: CATEGORIES.find((c) => c.value === filters.category)?.label ?? filters.category }
      : null,
    filters.maxPrice ? { key: "price", label: `Under ${rupees(filters.maxPrice)}` } : null,
    filters.minRating ? { key: "minrating", label: `${filters.minRating}★ and up` } : null,
  ].filter((x): x is { key: string; label: string } => Boolean(x));

  return (
    <>
      <PageHeader
        eyebrow="Module 07 · Verified services"
        title="The carpenter your hostel group chat keeps recommending"
        description="Every campus has five people it trusts for plumbing, AC, laundry and bike repair — and they are all found by asking around. CampusLoop verifies them once, prices them publicly, and lets you book a specific slot. Pay after the job, not before."
      >
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-white">{services.length}</p>
          <p className="text-[11px] text-white/45">services listed</p>
        </div>
        <div className="cl-panel px-4 py-3">
          <p className="text-2xl font-black text-mint-400">{verified}</p>
          <p className="text-[11px] text-white/45">ID verified</p>
        </div>
      </PageHeader>

      <Section className="pt-6">
        <div className="flex flex-col gap-3">
          <FilterBar
            filters={barFilters}
            placeholder="Search a service — “AC”, “leaking tap”, “print project”…"
            resultLabel={`${services.length} ${services.length === 1 ? "service" : "services"}`}
          />
          <ActiveFilters labels={activeLabels} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} colleges={colleges} />
          ))}
        </div>

        {services.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No providers match those filters"
              description="Try raising the price cap or clearing the rating filter. New providers are verified every week, so the list grows every month."
              action={
                <Link href="/services" className="cl-btn cl-btn-primary">
                  Show all providers
                </Link>
              }
            />
          </div>
        ) : null}

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <Callout title="How verification works" tone="mint" icon={<ShieldIcon width={18} height={18} />}>
            A government photo ID, an address proof tied to a serviceable PIN code, and two reference jobs completed on
            campus. Only then does the green tick appear. Unverified providers can list, but they sort below every verified
            one and cannot take slot bookings.
          </Callout>
          <Callout title="What CampusLoop keeps" tone="brand">
            A flat{" "}
            <strong className="text-white">
              {rupees(Math.round((services.reduce((a, s) => a + s.base_price, 0) / Math.max(1, services.length)) * 0.08))}
            </strong>{" "}
            per booking — roughly 8% — taken from the provider, never added on top of the student’s price. The student sees
            the same rate the provider quoted in the group chat.
          </Callout>
          <Callout title="The guarantee" tone="flare" icon={<WrenchIcon width={18} height={18} />}>
            If the job is not done as described, the booking is refunded in full from CampusLoop’s guarantee pool — not from
            the provider. That is the entire reason a student tries an unfamiliar electrician at 11pm on a Sunday.
          </Callout>
        </div>

        <div className="mt-6 cl-panel cl-panel-solid flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">
              {jobs.toLocaleString("en-IN")} jobs completed across these providers
              {cheapest ? ` · from ${rupees(cheapest.base_price)}` : ""}
            </p>
            <p className="mt-1 text-xs text-white/45">
              {myBookings.length} booking{myBookings.length === 1 ? "" : "s"} on your account. Services are a{" "}
              <Link href="/business" className="text-brand-300">
                transaction-fee line
              </Link>{" "}
              for CampusLoop, not a subscription.
            </p>
          </div>
          <Link href="/premium" className="cl-btn cl-btn-primary shrink-0">
            Priority booking with Premium
          </Link>
        </div>
      </Section>
    </>
  );
}