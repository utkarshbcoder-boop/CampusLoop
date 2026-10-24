"use client";

import Link from "next/link";
import { useCollection } from "@/lib/firebase/hooks";
import { useAuth } from "@/components/AuthProvider";
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
  { key: "listing_interests", label: "Buyer interest", emoji: "🙋", href: "/admin/listing_interests", description: "Interest in item listings" },
];

function CollectionCard({ info }: { info: CollectionInfo }) {
  const { data, loading } = useCollection(info.key);

  return (
    <Link href={info.href} className="cl-panel cl-panel-hover group flex flex-col p-5 transition">
      <div className="flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/6 text-xl">
          {info.emoji}
        </span>
        {loading ? (
          <span className="h-8 w-12 animate-pulse rounded bg-white/8" />
        ) : (
          <span className="text-2xl font-black text-white">{data.length}</span>
        )}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-white">{info.label}</h3>
      <p className="mt-0.5 text-[10px] text-white/35">{info.description}</p>
      <p className="mt-1 text-[11px] text-white/40">
        {loading ? "Loading…" : `${data.length} documents`}
      </p>
      <div className="mt-auto pt-3">
        <span className="text-xs font-medium text-brand-300 transition group-hover:text-brand-200">
          Manage →
        </span>
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: colleges } = useCollection<College>("colleges");
  const { data: profiles } = useCollection("profiles");
  const { data: listings } = useCollection("listings");
  const { data: homeListings } = useCollection("home_listings");

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

      {/* Collection grid */}
      <h2 className="mb-4 text-lg font-bold text-white">All Collections</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {COLLECTIONS.map((info) => (
          <CollectionCard key={info.key} info={info} />
        ))}
      </div>
    </div>
  );
}
