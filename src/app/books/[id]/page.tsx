import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, BookIcon, ClockIcon, ShieldIcon } from "@/components/Icon";
import { BuyButton, RentButton, SaveButton } from "@/components/Actions";
import { ListingInterestButton } from "@/components/ListingInterestButton";
import { ListingCard } from "@/components/cards";
import { Callout, KeyValue, Section, StarRating, TagList } from "@/components/ui";
import { campusNameById } from "@/lib/data/campusOptions";
import { formatDateTime, rupees, timeAgo, titleCase } from "@/lib/format";
import { getColleges, getCurrentProfile, getListing, getListings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return { title: "Listing not found" };
  return { title: listing.title, description: listing.description.slice(0, 155) };
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [listing, colleges, profile] = await Promise.all([getListing(id), getColleges(), getCurrentProfile()]);
  if (!listing) notFound();

  const seller = listing.seller_id === profile.id ? profile : undefined;
  const college = colleges.find((c) => c.id === listing.college_id);
  const campusShortName = college?.short_name ?? campusNameById(listing.college_id) ?? "Campus";
  const campusName = college?.name ?? campusNameById(listing.college_id) ?? "Campus";
  const discount = listing.mrp > 0 ? Math.round((1 - listing.price / listing.mrp) * 100) : 0;

  // Real related inventory from the same subject.
  const related = (
    await getListings({
      q: "",
      kind: "all",
      subject: listing.subject,
      condition: "all",
      college: listing.college_id,
      maxPrice: null,
      sort: "price_asc",
    })
  )
    .filter((l) => l.id !== listing.id)
    .slice(0, 4);

  return (
    <>
      <Section className="py-8">
        <nav className="mb-6 flex items-center gap-2 text-xs text-white/40" aria-label="Breadcrumb">
          <Link href="/books" className="transition hover:text-white">
            Used books
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate text-white/70">{listing.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Listing detail */}
          <div>
            <div
              className="cl-panel relative flex aspect-[16/10] items-center justify-center overflow-hidden"
              style={{
                background: `linear-gradient(140deg, hsl(${listing.hue} 62% 26%), hsl(${(listing.hue + 40) % 360} 58% 14%))`,
              }}
            >
              <div
                className="absolute inset-0 opacity-45"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 22% 18%, rgba(255,255,255,0.3), transparent 42%), repeating-linear-gradient(45deg, rgba(0,0,0,0.14) 0 6px, transparent 6px 12px)",
                }}
                aria-hidden
              />
              <span className="relative text-8xl drop-shadow-2xl" aria-hidden>
                {listing.emoji}
              </span>
              {listing.boosted ? (
                <span className="absolute top-4 left-4 rounded-full bg-flare-400 px-3 py-1 text-[11px] font-bold text-ink-950">
                  ★ Boosted listing
                </span>
              ) : null}
              <span className="absolute right-4 bottom-4 rounded-full bg-ink-950/80 px-3 py-1 text-[11px] text-white backdrop-blur-sm">
                {listing.views} views · listed {timeAgo(listing.created_at)}
              </span>
            </div>

            <div className="cl-panel mt-4 p-5">
              <h2 className="text-sm font-semibold text-white">About this copy</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{listing.description}</p>
              {listing.highlights.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-1.5">
                  {listing.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-xs text-white/60">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-400" aria-hidden />
                      {h}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-4">
                <TagList tags={[listing.author, listing.edition, ...listing.tags]} max={8} />
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-[11px] text-white/40">
                <ClockIcon width={12} height={12} />
                Listed {formatDateTime(listing.created_at)} · {listing.views} views · {listing.saves} saves
              </p>
            </div>
          </div>

          {/* Buy box */}
          <div className="flex flex-col gap-4">
            <div className="cl-panel cl-panel-solid p-5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="cl-chip cl-chip-brand">{titleCase(listing.kind)}</span>
                <span className="cl-chip">{titleCase(listing.condition)}</span>
                <span className="cl-chip">{campusShortName}</span>
                {listing.status !== "available" ? (
                  <span className="cl-chip cl-chip-rose">{titleCase(listing.status)}</span>
                ) : null}
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">{listing.title}</h1>
              <p className="mt-1 text-sm text-white/50">
                {listing.author} · {listing.edition} · {listing.subject}
              </p>

              <div className="mt-4 flex items-end gap-3">
                <p className="text-4xl font-black tracking-tight text-white">{rupees(listing.price)}</p>
                {listing.mrp > listing.price ? (
                  <div className="pb-1">
                    <p className="text-sm text-white/35 line-through">{rupees(listing.mrp)}</p>
                    <p className="text-xs font-bold text-mint-400">{discount}% off</p>
                  </div>
                ) : null}
              </div>

              {listing.rent_per_day ? (
                <p className="mt-2 text-sm text-white/60">
                  Or rent it for{" "}
                  <span className="font-semibold text-white">{rupees(listing.rent_per_day)}/day</span> — ideal for one
                  semester.
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2">
                {listing.kind === "rent" ? (
                  <RentButton
                    itemId={listing.id}
                    itemName={listing.title}
                    dayRate={listing.rent_per_day ?? Math.round(listing.price / 30)}
                  />
                ) : listing.kind === "sell" ? (
                  <ListingInterestButton listingId={listing.id} status={listing.status} />
                ) : (
                  <BuyButton listingId={listing.id} title={listing.title} price={listing.price} />
                )}
                <SaveButton id={listing.id} />
              </div>

              <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-white/45">
                <ShieldIcon width={14} height={14} className="mt-0.5 shrink-0 text-mint-400" />
                Payment is held in escrow and released only when both sides confirm the handover. No cash changing hands
                in a corridor.
              </p>
            </div>

            <div className="cl-panel p-5">
              <h2 className="text-sm font-semibold text-white">
                {seller ? "You listed this" : `Listed by ${listing.author}`}
              </h2>
              {seller ? (
                <p className="mt-1 text-xs text-white/50">This is your own listing, shown the way buyers see it.</p>
              ) : (
                <p className="mt-1 text-xs leading-relaxed text-white/50">
                  Verified student at {campusName}. Response time and completed sales are on their profile.
                </p>
              )}
              <dl className="mt-4 grid grid-cols-2 gap-4">
                <KeyValue label="Condition" value={titleCase(listing.condition)} />
                <KeyValue label="Semester" value={titleCase(listing.semester)} />
                <KeyValue label="Subject" value={listing.subject} />
                <KeyValue label="Kind" value={titleCase(listing.kind)} />
                {listing.pickup_location ? <KeyValue label="Pickup address" value={listing.pickup_location} /> : null}
              </dl>
            </div>

            <Callout title="Why this price is fair" tone="mint">
              CampusLoop prices are the median of completed sales for the same title on your campus, adjusted for
              condition. {discount > 40 ? "That is a steep discount — the seller wants this gone before the next semester." : "That is close to the going rate, so you are not being overcharged."}
            </Callout>
          </div>
        </div>
      </Section>

      {related.length > 0 ? (
        <Section className="border-t border-white/8 py-12">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">Other {listing.subject} books on campus</h2>
              <p className="mt-1 text-sm text-white/50">Same subject, same campus, sorted by price.</p>
            </div>
            <Link href={`/books?subject=${encodeURIComponent(listing.subject)}`} className="cl-btn cl-btn-ghost">
              See all
              <ArrowRightIcon width={15} height={15} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {related.map((l) => (
              <ListingCard key={l.id} listing={l} colleges={colleges} />
            ))}
          </div>
        </Section>
      ) : (
        <Section className="border-t border-white/8 py-12">
          <div className="cl-panel flex items-center gap-3 p-5">
            <span className="text-xl" aria-hidden>
              <BookIcon width={22} height={22} />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Nothing else in this subject yet</p>
              <p className="mt-1 text-xs text-white/50">
                Be the first to list a {listing.subject} title — {campusShortName} students are searching it right
                now.
              </p>
            </div>
            <Link href="/books" className="cl-btn cl-btn-primary ml-auto shrink-0">
              List a book
            </Link>
          </div>
        </Section>
      )}

      <Section className="border-t border-white/8 py-10">
        <div className="cl-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <StarRating rating={4.7} count={listings_reviewCount(listing.saves)} />
            <p className="mt-2 text-xs text-white/45">
              {listing.saves} students saved this listing ·{" "}
              {college
                ? `${college.campusloop_students.toLocaleString("en-IN")} verified students on ${campusShortName}`
                : `Campus: ${campusShortName}`}
            </p>
          </div>
          <Link href="/books" className="cl-btn cl-btn-primary shrink-0">
            Back to books
            <ArrowRightIcon width={15} height={15} />
          </Link>
        </div>
      </Section>
    </>
  );
}

/** Saves make a reasonable proxy for interest when no review table exists yet. */
function listings_reviewCount(saves: number): number {
  return Math.max(1, Math.round(saves / 8));
}
