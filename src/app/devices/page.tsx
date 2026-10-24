import type { Metadata } from "next";
import { DeviceMarketplace } from "@/components/DeviceMarketplace";
import { PageHeader, Section } from "@/components/ui";
import { getColleges, getDeviceListingsPage, sp, type SearchParams } from "@/lib/queries";
import type { DeviceCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Second-hand Phones, Laptops & Tablets",
  description: "Browse used phones, laptops, and tablets from campus sellers.",
};

export default async function DevicesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const categoryParam = sp(params.category);
  const category: DeviceCategory | "all" =
    categoryParam === "mobile" || categoryParam === "laptop"
      || categoryParam === "tablet" || categoryParam === "other"
      ? categoryParam
      : "all";
  const [{ listings, hasMore, nextAfter, nextPage }, colleges] = await Promise.all([
    getDeviceListingsPage({ q: sp(params.q), category }, { after: sp(params.after), page: Number.parseInt(sp(params.page), 10) || 1 }),
    getColleges(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Second-hand items · Devices"
        title="Phones, laptops & tablets"
        description="Browse second-hand devices, compare details, and contact sellers before arranging a handover."
      />
      <Section className="pt-6">
        <DeviceMarketplace
          listings={listings}
          colleges={colleges}
          search={sp(params.q)}
          category={category}
          hasMore={hasMore}
          nextAfter={nextAfter}
          nextPage={nextPage}
        />
      </Section>
    </>
  );
}
