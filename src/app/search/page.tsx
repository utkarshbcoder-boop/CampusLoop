import type { Metadata } from "next";
import Link from "next/link";
import { PinIcon } from "@/components/Icon";
import { ListingCard } from "@/components/cards";
import { EmptyState, PageHeader, Section } from "@/components/ui";
import { HOMES, HOME_TYPE_LABELS, type Home } from "@/lib/data/homes";
import { rupees } from "@/lib/format";
import { getColleges, getSecondhandListings, sp, type SearchParams } from "@/lib/queries";
import type { College, Listing } from "@/lib/types";
import type { HomeMarketplaceListing } from "@/lib/firebase/marketplace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  description: "Search second-hand books, devices, and homes near your campus.",
};

/**
 * One-shot Firestore homes. Skipped entirely in sample mode
 * (`NEXT_PUBLIC_USE_FIREBASE` is not "true") so e2e never touches Firestore;
 * a denied/failed read degrades to the seeded sample homes only.
 */
async function loadFirestoreHomes(): Promise<Home[]> {
  if (process.env.NEXT_PUBLIC_USE_FIREBASE !== "true") return [];
  try {
    const [{ collection, getDocs }, { db }] = await Promise.all([
      import("firebase/firestore"),
      import("@/lib/firebase/config"),
    ]);
    const snapshot = await getDocs(collection(db, "home_listings"));
    return snapshot.docs.map((document) => {
      const row = { id: document.id, ...document.data() } as HomeMarketplaceListing;
      return {
        id: row.id,
        title: row.title,
        locality: row.locality,
        type: row.type,
        mode: row.mode,
        price: row.price,
        beds: row.beds,
        baths: row.baths,
        furnished: row.furnished,
        distanceKm: row.distanceKm,
        available: row.available,
        owner: row.owner,
        ...(row.shop_name ? { shop_name: row.shop_name } : {}),
        ...(row.shop_address ? { shop_address: row.shop_address } : {}),
      };
    });
  } catch (cause) {
    console.error("Search: could not load Firestore homes:", cause);
    return [];
  }
}

function quickLinks() {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/books" className="cl-btn cl-btn-ghost">
        Browse books
      </Link>
      <Link href="/devices" className="cl-btn cl-btn-ghost">
        Browse devices
      </Link>
      <Link href="/homes" className="cl-btn cl-btn-ghost">
        Browse homes
      </Link>
    </div>
  );
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  // Collapse string|string[]|undefined into one query, then trim/normalise spacing.
  const q = sp(params.q).trim().replace(/\s+/g, " ");

  let listings: Listing[] = [];
  let colleges: College[] = [];
  let homes: Home[] = [];
  let failed = false;

  // The landing page (no query) never touches the data layer.
  if (q) {
    try {
      [listings, colleges, homes] = await Promise.all([
        getSecondhandListings(),
        // Colleges are decoration for the cards — a denied read just falls back to "Campus".
        getColleges().catch((cause) => {
          console.error("Search: could not load colleges:", cause);
          return [] as College[];
        }),
        loadFirestoreHomes().then((extra) => [...HOMES, ...extra]),
      ]);
    } catch (cause) {
      console.error("Search: data load failed:", cause);
      failed = true;
    }
  }

  const term = q.toLowerCase();
  const itemMatches = term
    ? listings.filter((listing) =>
        [listing.title, listing.author, listing.subject, listing.description, listing.pickup_location ?? "", listing.shop_name ?? "", listing.shop_address ?? "", ...listing.tags]
          .join(" ")
          .toLowerCase()
          .includes(term),
      )
    : [];
  const homeMatches = term
    ? homes.filter((home) =>
        `${home.title} ${home.locality} ${home.owner} ${home.shop_name ?? ""} ${home.shop_address ?? ""}`
          .toLowerCase()
          .includes(term),
      )
    : [];

  return (
    <>
      <PageHeader
        eyebrow="Search"
        title={q ? `Results for “${q}”` : "Search CampusLoop"}
        description={
          q
            ? "Matches across second-hand items and homes, ranked by simple text relevance."
            : "Look up a book by title or author, a device by name, or a home by locality."
        }
      />
      <Section className="pt-6">
        <form action="/search" method="get" className="flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search books, devices, homes — try “Cormen” or “Koramangala”"
            className="cl-input flex-1"
            aria-label="Search query"
          />
          <button type="submit" className="cl-btn cl-btn-primary shrink-0">
            Search
          </button>
        </form>

        {failed ? (
          <div className="cl-panel mt-6 p-8 text-center">
            <p role="alert" className="text-sm text-rose-300">
              We couldn&apos;t load search results right now. The data store may be locked — try again in a bit.
            </p>
            <div className="mt-4 flex justify-center">{quickLinks()}</div>
          </div>
        ) : !q ? (
          <div className="cl-panel mt-6 p-8 text-center">
            <p className="text-sm text-white/55">
              Start typing a query above, or jump straight into a browse page.
            </p>
            <div className="mt-4 flex justify-center">{quickLinks()}</div>
          </div>
        ) : itemMatches.length === 0 && homeMatches.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title={`No matches for “${q}”`}
              description="Try a title, author, subject, or locality."
              action={quickLinks()}
            />
          </div>
        ) : (
          <>
            <p className="mt-6 text-xs text-white/40">
              {itemMatches.length} {itemMatches.length === 1 ? "item" : "items"} · {homeMatches.length}{" "}
              {homeMatches.length === 1 ? "home" : "homes"} found
            </p>

            {itemMatches.length > 0 ? (
              <section aria-label="Item results" className="mt-4">
                <h2 className="mb-4 text-lg font-bold text-white">Items</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {itemMatches.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} colleges={colleges} />
                  ))}
                </div>
              </section>
            ) : null}

            {homeMatches.length > 0 ? (
              <section aria-label="Home results" className="mt-10">
                <h2 className="mb-4 text-lg font-bold text-white">Homes</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {homeMatches.map((home) => (
                    <article key={home.id} className="cl-panel cl-panel-hover flex flex-col gap-3 p-5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="cl-chip cl-chip-brand">{HOME_TYPE_LABELS[home.type]}</span>
                        <span className={`cl-chip ${home.mode === "rent" ? "cl-chip-mint" : "cl-chip-flare"}`}>
                          {home.mode === "rent" ? "For rent" : "For sale"}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold leading-snug text-white">
                        <Link href={`/homes/${home.id}`} prefetch={false} className="transition hover:text-brand-200">
                          {home.title}
                        </Link>
                      </h3>
                      <p className="flex items-center gap-1 text-xs text-white/45">
                        <PinIcon width={12} height={12} />
                        {home.locality}
                        {home.distanceKm > 0 ? ` · ${home.distanceKm} km from campus` : ""}
                      </p>
                      <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/8 pt-3">
                        <p className="text-lg font-bold text-white">
                          {rupees(home.price)}
                          {home.mode === "rent" ? (
                            <span className="text-xs font-normal text-white/45">/mo</span>
                          ) : null}
                        </p>
                        <Link
                          href={`/homes/${home.id}`}
                          prefetch={false}
                          className="cl-btn cl-btn-primary px-3 py-1.5 text-xs"
                        >
                          View details
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </Section>
    </>
  );
}
