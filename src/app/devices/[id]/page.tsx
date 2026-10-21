import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClockIcon, PinIcon } from "@/components/Icon";
import { RentButton } from "@/components/Actions";
import { ListingInterestButton } from "@/components/ListingInterestButton";
import { Callout, KeyValue, Section, StarRating, TagList, Thumbnail } from "@/components/ui";
import { equipmentCategoryLabel } from "@/lib/data/equipmentCategories";
import { getColleges, getEquipmentItem, getListing } from "@/lib/queries";
import { getDataProvider } from "@/lib/db";
import { formatDateTime, rupees } from "@/lib/format";
import type { Listing } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = await getEquipmentItem(id);
  if (!item) {
    const listing = await getListing(id);
    return listing?.item_type === "device"
      ? { title: listing.title, description: listing.description.slice(0, 155) }
      : { title: "Device listing not found" };
  }
  return { title: item.name, description: item.description.slice(0, 155) };
}

function ResaleDeviceDetail({ listing }: { listing: Listing }) {
  return (
    <Section className="py-8">
      <nav className="mb-6 flex items-center gap-2 text-xs text-white/40" aria-label="Breadcrumb">
        <Link href="/devices" className="transition hover:text-white">Devices & gear</Link>
        <span aria-hidden>/</span>
        <span className="truncate text-white/70">{listing.title}</span>
      </nav>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="cl-panel cl-panel-solid flex min-h-64 items-center justify-center p-8">
          <span className="text-8xl" aria-hidden>{listing.emoji || "💻"}</span>
        </div>
        <div className="cl-panel cl-panel-solid p-6">
          <div className="flex flex-wrap gap-2">
            <span className="cl-chip cl-chip-brand">Second-hand device</span>
            <span className="cl-chip">{listing.status === "available" ? "Available" : listing.status}</span>
            <span className="cl-chip">{listing.condition.replaceAll("_", " ")}</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">{listing.title}</h1>
          <p className="mt-2 text-sm text-white/55">{listing.author} · {listing.edition}</p>
          <p className="mt-4 text-3xl font-black text-white">{rupees(listing.price)}</p>
          <p className="mt-4 text-sm leading-relaxed text-white/60">{listing.description}</p>
          <dl className="mt-5 grid gap-3">
            <KeyValue label="Category / details" value={listing.subject} />
            <KeyValue label="Pickup address" value={listing.pickup_location || "Contact seller"} />
          </dl>
          <div className="mt-6">
            <ListingInterestButton listingId={listing.id} status={listing.status} />
          </div>
        </div>
      </div>
    </Section>
  );
}

export default async function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getEquipmentItem(id);
  if (!item) {
    const listing = await getListing(id);
    if (listing?.item_type === "device") return <ResaleDeviceDetail listing={listing} />;
    notFound();
  }
  const [colleges, provider] = await Promise.all([getColleges(), getDataProvider()]);

  const [owner, college] = await Promise.all([
    provider.profiles.byId(item.owner_id),
    Promise.resolve(colleges.find((entry) => entry.id === item.college_id)),
  ]);

  return (
    <Section className="py-8">
      <nav className="mb-6 flex items-center gap-2 text-xs text-white/40" aria-label="Breadcrumb">
        <Link href="/devices" className="transition hover:text-white">Devices & gear</Link>
        <span aria-hidden>/</span>
        <span className="truncate text-white/70">{item.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="cl-panel relative aspect-[16/10] overflow-hidden">
            <Thumbnail hue={item.hue} emoji={item.emoji} size="lg" label={item.name} />
            <span className="absolute top-4 left-4 rounded-full bg-ink-950/75 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {equipmentCategoryLabel(item.category)}
            </span>
          </div>
          <div className="cl-panel mt-4 p-5">
            <h2 className="text-sm font-semibold text-white">About this item</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/65">{item.description}</p>
            <h3 className="mt-5 text-sm font-semibold text-white">Specifications</h3>
            <ul className="mt-3 flex flex-col gap-2">
              {item.specs.map((spec) => (
                <li key={spec} className="flex items-start gap-2 text-sm text-white/60">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" aria-hidden />
                  {spec}
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-center gap-1.5 text-[11px] text-white/40">
              <ClockIcon width={12} height={12} />
              Listed {formatDateTime(item.created_at)}
            </p>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="cl-panel cl-panel-solid p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="cl-chip cl-chip-brand">{equipmentCategoryLabel(item.category)}</span>
              {item.delivery_available ? <span className="cl-chip cl-chip-mint">Hostel delivery</span> : null}
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">{item.name}</h1>
            <p className="mt-1 text-sm text-white/45">{item.brand}</p>
            <div className="mt-3"><StarRating rating={item.rating} count={item.rating_count} /></div>
            <div className="mt-5 border-t border-white/8 pt-4">
              <p className="text-2xl font-black text-white">
                {rupees(item.day_rate)}<span className="text-sm font-medium text-white/45"> /day</span>
              </p>
              <p className="mt-1 text-xs text-white/45">
                {rupees(item.week_rate)} / week · {rupees(item.deposit)} refundable deposit
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <RentButton itemId={item.id} itemName={item.name} dayRate={item.day_rate} />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-white/40">
              Demo reservation only. Confirm availability and payment directly with the owner before pickup.
            </p>
          </div>

          <div className="cl-panel p-5">
            <h2 className="text-sm font-semibold text-white">Pickup & availability</h2>
            <dl className="mt-4 grid gap-4">
              <KeyValue label="Campus" value={college?.short_name ?? "Campus"} />
              <KeyValue label="Pickup location" value={<span className="flex items-start gap-1.5"><PinIcon width={13} height={13} />{item.pickup_location}</span>} />
              <KeyValue label="Availability" value={item.availability} />
              <KeyValue label="Condition" value={item.condition} />
              {owner ? <KeyValue label="Listed by" value={owner.name} /> : null}
            </dl>
          </div>

          <Callout title="Before you reserve" tone="mint">
            Check the pickup time and inspect the equipment with the owner. The listed deposit is refundable after the item is returned in the agreed condition.
          </Callout>
          <TagList tags={item.specs} max={5} />
        </aside>
      </div>
    </Section>
  );
}
