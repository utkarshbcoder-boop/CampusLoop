"use client";

import Link from "next/link";
import { SaveButton } from "@/components/Actions";
import { useCampusLoop } from "@/lib/store";
import { rupees } from "@/lib/format";
import type { Home } from "@/lib/data/homes";
import type { Listing, PGListing } from "@/lib/types";

export function SavedFavorites({
  listings,
  pgListings,
  homes,
}: {
  listings: Listing[];
  pgListings: PGListing[];
  homes: Home[];
}) {
  const { premium, saved, hydrated } = useCampusLoop();

  if (!hydrated) {
    return <div className="cl-panel p-6 text-sm text-white/55">Loading your saved listings…</div>;
  }

  if (!premium) {
    return (
      <div className="cl-panel p-6">
        <h2 className="text-lg font-semibold text-white">Saved favorites are a Premium feature</h2>
        <p className="mt-2 text-sm text-white/55">
          Upgrade to star books, rooms, and PG listings and keep them together here.
        </p>
        <Link href="/premium" className="cl-btn cl-btn-flare mt-5">
          See Premium benefits
        </Link>
      </div>
    );
  }

  const savedBooks = listings.filter((listing) => saved.includes(listing.id));
  const savedPGs = pgListings.filter((pg) => saved.includes(`pg:${pg.id}`));
  const savedHomes = homes.filter((home) => saved.includes(`home:${home.id}`));
  const total = savedBooks.length + savedPGs.length + savedHomes.length;

  if (total === 0) {
    return (
      <div className="cl-panel p-6">
        <h2 className="text-lg font-semibold text-white">No saved listings yet</h2>
        <p className="mt-2 text-sm text-white/55">Tap the star on a book, room, or PG listing to save it here.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/books" className="cl-btn cl-btn-ghost">Browse books</Link>
          <Link href="/homes" className="cl-btn cl-btn-ghost">Browse rooms & PGs</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {savedBooks.map((listing) => (
        <article key={listing.id} className="cl-panel flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <p className="text-[11px] text-white/40">Used book</p>
            <Link href={`/books/${listing.id}`} className="mt-1 block font-semibold text-white hover:text-brand-200">
              {listing.title}
            </Link>
            <p className="mt-1 text-sm text-white/55">{rupees(listing.price)}</p>
          </div>
          <SaveButton id={listing.id} label="Star" />
        </article>
      ))}
      {savedPGs.map((pg) => (
        <article key={`pg:${pg.id}`} className="cl-panel flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <p className="text-[11px] text-white/40">Room / PG</p>
            <Link href={`/pg/${pg.id}`} className="mt-1 block font-semibold text-white hover:text-brand-200">
              {pg.title}
            </Link>
            <p className="mt-1 text-sm text-white/55">{pg.locality} · {rupees(pg.rent)} / month</p>
          </div>
          <SaveButton id={`pg:${pg.id}`} label="Star" />
        </article>
      ))}
      {savedHomes.map((home) => (
        <article key={`home:${home.id}`} className="cl-panel flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <p className="text-[11px] text-white/40">Room / PG</p>
            <Link href="/homes" className="mt-1 block font-semibold text-white hover:text-brand-200">
              {home.title}
            </Link>
            <p className="mt-1 text-sm text-white/55">{home.locality} · {rupees(home.price)}{home.mode === "rent" ? " / month" : ""}</p>
          </div>
          <SaveButton id={`home:${home.id}`} label="Star" />
        </article>
      ))}
    </div>
  );
}
