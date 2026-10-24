"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ListingGrid } from "@/components/ListingGrid";
import { EmptyState } from "@/components/ui";
import { DEVICE_CATEGORIES } from "@/lib/marketplaceCategories";
import type { College, DeviceCategory, Listing } from "@/lib/types";

export function DeviceMarketplace({
  listings,
  colleges,
  search,
  category,
  hasMore,
  nextAfter,
  nextPage,
}: {
  listings: Listing[];
  colleges: College[];
  search: string;
  category: DeviceCategory | "all";
  hasMore: boolean;
  nextAfter: string;
  nextPage: number;
}) {
  const router = useRouter();

  return (
    <>
      <form action="/devices" method="get" className="cl-panel cl-panel-solid grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
        <input
          className="cl-input"
          name="q"
          defaultValue={search}
          placeholder="Search phones, laptops, tablets, brands or specs…"
          aria-label="Search devices"
        />
        <select
          className="cl-input sm:w-52"
          name="category"
          defaultValue={category}
          onChange={(event) => {
            const form = event.currentTarget.form;
            if (!form) return;
            const formData = new FormData(form);
            const params = new URLSearchParams();
            const query = String(formData.get("q") ?? "").trim();
            const selectedCategory = String(formData.get("category") ?? "all");
            if (query) params.set("q", query);
            if (selectedCategory !== "all") params.set("category", selectedCategory);
            router.push(`/devices${params.size ? `?${params.toString()}` : ""}`);
          }}
          aria-label="Filter by device type"
        >
          <option value="all">All devices</option>
          {DEVICE_CATEGORIES.filter((device) => device.value !== "other").map((device) => (
            <option key={device.value} value={device.value}>{device.label}</option>
          ))}
          <option value="other">Other devices</option>
        </select>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-white/45">
          Showing {listings.length}{hasMore ? "+" : ""} second-hand {listings.length === 1 ? "device" : "devices"}
        </p>
        <Link href="/sell?type=device" className="cl-btn cl-btn-primary">
          List a phone, laptop or tablet
        </Link>
      </div>

      {listings.length ? (
        <ListingGrid listings={listings} colleges={colleges} />
      ) : (
        <EmptyState
          title="No devices match these filters"
          description="Try a different search or device type, or be the first to list one."
          action={
            <Link href="/sell?type=device" className="cl-btn cl-btn-primary">
              List a phone, laptop or tablet
            </Link>
          }
        />
      )}
      {hasMore ? (() => {
        const nextParams = new URLSearchParams();
        if (search) nextParams.set("q", search);
        if (category !== "all") nextParams.set("category", category);
        if (nextAfter) nextParams.set("after", nextAfter);
        else nextParams.set("page", String(nextPage));
        return (
          <nav className="mt-8 flex justify-center" aria-label="Device listing pages">
            <Link href={`/devices?${nextParams.toString()}`} className="cl-btn cl-btn-ghost">
              Next page
            </Link>
          </nav>
        );
      })() : null}
    </>
  );
}
