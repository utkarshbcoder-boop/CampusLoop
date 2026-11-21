"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { deleteField, doc, updateDoc } from "firebase/firestore";
import { useCollection } from "@/lib/firebase/hooks";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase/config";
import type { College } from "@/lib/types";

interface CollectionInfo {
  key: string;
  label: string;
  emoji: string;
  href: string;
  description: string;
}

const COLLECTIONS: CollectionInfo[] = [
  { key: "colleges", label: "Colleges", emoji: "🏛️", href: "/admin/colleges", description: "Campus data & stats" },
  { key: "profiles", label: "Users", emoji: "👤", href: "/admin/profiles", description: "Student accounts & info" },
  { key: "listings", label: "Second-hand items", emoji: "🛍️", href: "/admin/listings", description: "Used item listings" },
  { key: "home_listings", label: "Rooms & homes", emoji: "🏠", href: "/admin/home_listings", description: "Rooms, flats & PG listings" },
  { key: "pg_listings", label: "PG & Rooms", emoji: "🏠", href: "/admin/pg_listings", description: "PG & shared flat listings" },
  { key: "listing_interests", label: "Buyer interest", emoji: "🙋", href: "/admin/listing_interests", description: "Interest in item listings" },
  { key: "bids", label: "Auction bids", emoji: "🔨", href: "/admin/bids", description: "Bids on timed auctions" },
  { key: "reports", label: "Reports", emoji: "🚩", href: "/admin/reports", description: "Flagged listings & reviews" },
];

function CollectionCard({
  info,
  count,
  loading,
}: {
  info: CollectionInfo;
  count: number;
  loading: boolean;
}) {
  return (
    <Link href={info.href} className="cl-panel cl-panel-hover group flex flex-col p-5 transition">
      <div className="flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/6 text-xl">
          {info.emoji}
        </span>
        {loading ? (
          <span className="h-8 w-12 animate-pulse rounded bg-white/8" />
        ) : (
          <span className="text-2xl font-black text-white">{count}</span>
        )}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-white">{info.label}</h3>
      <p className="mt-0.5 text-[10px] text-white/35">{info.description}</p>
      <p className="mt-1 text-[11px] text-white/40">
        {loading ? "Loading…" : `${count} documents`}
      </p>
      <div className="mt-auto pt-3">
        <span className="text-xs font-medium text-brand-300 transition group-hover:text-brand-200">
          Manage →
        </span>
      </div>
    </Link>
  );
}

interface AdminProfile {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  shop_name?: string;
  shop_address?: string;
}

/**
 * One-click shopkeeper grants. Firestore rules only let an admin write the
 * `role` field, and revoking removes it entirely — the account falls back to
 * a regular student with no Shop tab access.
 */
function ShopkeepersPanel({ profiles }: { profiles: AdminProfile[] }) {
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const shopkeepers = useMemo(
    () => profiles.filter((profile) => profile.role === "shopkeeper"),
    [profiles],
  );
  const term = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!term) return [];
    return profiles
      .filter((profile) => profile.role !== "shopkeeper")
      .filter((profile) =>
        `${profile.name ?? ""} ${profile.email ?? ""}`.toLowerCase().includes(term),
      )
      .slice(0, 8);
  }, [profiles, term]);

  async function setRole(profile: AdminProfile, role: "shopkeeper" | null) {
    setBusyId(profile.id);
    setNotice("");
    setError("");
    try {
      if (role) {
        await updateDoc(doc(db, "profiles", profile.id), { role });
        setNotice(`${profile.name || profile.email || "This account"} can now use the Shop dashboard.`);
      } else {
        await updateDoc(doc(db, "profiles", profile.id), { role: deleteField() });
        setNotice(`Shop access revoked for ${profile.name || profile.email || "this account"}.`);
      }
    } catch (cause) {
      console.error("Failed to update shopkeeper role:", cause);
      setError("Could not update this account. Only the admin can change roles — check your connection and try again.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="mb-8 rounded-xl border border-brand-400/25 bg-brand-500/8 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-white">🏪 Shopkeepers</h2>
        <span className="cl-chip cl-chip-mint">{shopkeepers.length} active</span>
      </div>
      <p className="mt-1 text-xs text-white/50">
        Shopkeepers sign in with their own account, then add books, devices, and homes from the Shop
        tab — each listing shows their shop name and address. You keep full access; revoke anytime.
      </p>

      {notice ? <p role="status" className="mt-3 text-xs text-mint-300">{notice}</p> : null}
      {error ? <p role="alert" className="mt-3 text-xs text-rose-300">{error}</p> : null}

      <div className="mt-4 grid gap-3">
        {shopkeepers.length === 0 ? (
          <p className="text-xs text-white/45">No shopkeepers yet — search below to promote an account.</p>
        ) : (
          shopkeepers.map((profile) => (
            <div
              key={profile.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {profile.name || profile.email || profile.id}
                </p>
                <p className="truncate text-[11px] text-white/45">
                  {profile.email ?? profile.id}
                  {profile.shop_name ? ` · 🏪 ${profile.shop_name}` : " · shop identity not set yet"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void setRole(profile, null)}
                disabled={busyId !== ""}
                className="cl-btn cl-btn-ghost px-3 py-1 text-xs text-rose-300 disabled:opacity-50"
              >
                {busyId === profile.id ? "Revoking…" : "Revoke access"}
              </button>
            </div>
          ))
        )}
      </div>

      <label className="mt-4 flex flex-col gap-1.5">
        <span className="text-[11px] tracking-wider text-white/40 uppercase">Promote an account</span>
        <input
          className="cl-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or email — e.g. utkarshb207@gmail.com"
        />
      </label>
      {matches.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {matches.map((profile) => (
            <div
              key={profile.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {profile.name || profile.email || profile.id}
                </p>
                <p className="truncate text-[11px] text-white/45">{profile.email ?? profile.id}</p>
              </div>
              <button
                type="button"
                onClick={() => void setRole(profile, "shopkeeper")}
                disabled={busyId !== ""}
                className="cl-btn cl-btn-primary px-3 py-1 text-xs disabled:opacity-50"
              >
                {busyId === profile.id ? "Granting…" : "Make shopkeeper"}
              </button>
            </div>
          ))}
        </div>
      ) : term ? (
        <p className="mt-3 text-xs text-white/45">No accounts match “{query}”.</p>
      ) : null}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: colleges, loading: collegesLoading } = useCollection<College>("colleges");
  const { data: profiles, loading: profilesLoading } = useCollection<AdminProfile>("profiles");
  const { data: listings, loading: listingsLoading } = useCollection("listings");
  const { data: homeListings, loading: homeListingsLoading } = useCollection("home_listings");
  const { data: pgListings, loading: pgListingsLoading } = useCollection("pg_listings");
  const { data: listingInterests, loading: listingInterestsLoading } = useCollection("listing_interests");
  const { data: bids, loading: bidsLoading } = useCollection("bids");
  const { data: reports, loading: reportsLoading } = useCollection("reports");

  // Each collection is subscribed to exactly once; counts are passed down to the cards.
  const collectionCounts: Record<string, { count: number; loading: boolean }> = {
    colleges: { count: colleges.length, loading: collegesLoading },
    profiles: { count: profiles.length, loading: profilesLoading },
    listings: { count: listings.length, loading: listingsLoading },
    home_listings: { count: homeListings.length, loading: homeListingsLoading },
    pg_listings: { count: pgListings.length, loading: pgListingsLoading },
    listing_interests: { count: listingInterests.length, loading: listingInterestsLoading },
    bids: { count: bids.length, loading: bidsLoading },
    reports: { count: reports.length, loading: reportsLoading },
  };

  const totalStudents = colleges.reduce((sum, c) => sum + c.campusloop_students, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white sm:text-3xl">🛡️ Admin Dashboard</h1>
        <p className="mt-1 text-sm text-white/50">
          Welcome back, {user?.displayName?.split(" ")[0]}. Full control over CampusLoop.
        </p>
      </div>

      {/* Real-time sync banner */}
      <div className="mb-6 rounded-xl border border-brand-400/30 bg-brand-500/10 px-5 py-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-brand-200">
          <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-mint-400" />
          Real-time sync active
        </p>
        <p className="mt-1 text-xs text-white/50">
          Everything you edit here instantly updates for all connected users worldwide.
          The website stays live while you make changes — users never need to refresh.
        </p>
      </div>

      {/* Quick stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="cl-panel cl-panel-solid p-5">
          <p className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">Campuses</p>
          <p className="mt-1 text-3xl font-black text-white">{colleges.length}</p>
        </div>
        <div className="cl-panel cl-panel-solid p-5">
          <p className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">Registered Users</p>
          <p className="mt-1 text-3xl font-black text-white">{profiles.length}</p>
        </div>
        <div className="cl-panel cl-panel-solid p-5">
          <p className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">Active Listings</p>
          <p className="mt-1 text-3xl font-black text-white">{listings.length + homeListings.length}</p>
        </div>
        <div className="cl-panel cl-panel-solid p-5">
          <p className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">Total Students</p>
          <p className="mt-1 text-3xl font-black text-white">{totalStudents.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Admin capabilities */}
      <div className="mb-6 rounded-xl border border-white/8 bg-white/3 p-5">
        <h2 className="text-sm font-bold text-white">🔑 Your Admin Powers</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start gap-2 text-[11px] text-white/50">
            <span className="text-mint-400">✓</span>
            Add, edit, delete any document in real-time
          </div>
          <div className="flex items-start gap-2 text-[11px] text-white/50">
            <span className="text-mint-400">✓</span>
            Remove abusive users or content instantly
          </div>
          <div className="flex items-start gap-2 text-[11px] text-white/50">
            <span className="text-mint-400">✓</span>
            Manage second-hand item and property listings
          </div>
          <div className="flex items-start gap-2 text-[11px] text-white/50">
            <span className="text-mint-400">✓</span>
            Control user profiles and permissions
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/profiles"
          className="cl-panel cl-panel-hover flex items-center gap-3 p-4 transition"
        >
          <span className="text-lg">👮</span>
          <div>
            <p className="text-xs font-semibold text-white">Manage Users</p>
            <p className="text-[10px] text-white/35">Ban abusive accounts</p>
          </div>
        </Link>
        <Link
          href="/admin/listings"
          className="cl-panel cl-panel-hover flex items-center gap-3 p-4 transition"
        >
          <span className="text-lg">📚</span>
          <div>
            <p className="text-xs font-semibold text-white">Review Listings</p>
            <p className="text-[10px] text-white/35">Remove inappropriate items</p>
          </div>
        </Link>
        <Link
          href="/admin/home_listings"
          className="cl-panel cl-panel-hover flex items-center gap-3 p-4 transition"
        >
          <span className="text-lg">🏠</span>
          <div>
            <p className="text-xs font-semibold text-white">Rooms & Homes</p>
            <p className="text-[10px] text-white/35">Moderate property listings</p>
          </div>
        </Link>
      </div>

      {/* Shopkeeper grants */}
      <ShopkeepersPanel profiles={profiles} />

      {/* Collection grid */}
      <h2 className="mb-4 text-lg font-bold text-white">All Collections</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {COLLECTIONS.map((info) => (
          <CollectionCard
            key={info.key}
            info={info}
            count={collectionCounts[info.key].count}
            loading={collectionCounts[info.key].loading}
          />
        ))}
      </div>
    </div>
  );
}
