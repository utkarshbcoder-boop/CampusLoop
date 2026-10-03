"use client";

/**
 * Seed Firestore from mock data.
 *
 * This component is rendered at `/admin/seed` and pushes all the seeded
 * local data into Firestore with a single click. It is meant to be run
 * once to bootstrap the database.
 */

import { useState } from "react";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// Import all mock data using the actual export names
import { colleges } from "@/lib/data/colleges";
import { profiles } from "@/lib/data/profiles";
import { listings } from "@/lib/data/listings";
import { equipment } from "@/lib/data/equipment";
import { pgListings } from "@/lib/data/pgListings";
import { teammatePosts } from "@/lib/data/teammatePosts";
import { skillProfiles } from "@/lib/data/skillProfiles";
import { campusEvents } from "@/lib/data/campusEvents";
import { campusServices } from "@/lib/data/campusServices";
import { opportunities } from "@/lib/data/opportunities";
import {
  transactions,
  collegeSubscriptions,
  sponsorships,
  notifications,
} from "@/lib/data/business";

interface SeedCollection {
  name: string;
  label: string;
  emoji: string;
  data: Record<string, unknown>[];
}

const SEED_COLLECTIONS: SeedCollection[] = [
  { name: "colleges", label: "Colleges", emoji: "🏛️", data: colleges as unknown as Record<string, unknown>[] },
  { name: "profiles", label: "Profiles", emoji: "👤", data: profiles as unknown as Record<string, unknown>[] },
  { name: "listings", label: "Books", emoji: "📚", data: listings as unknown as Record<string, unknown>[] },
  { name: "equipment", label: "Equipment", emoji: "💻", data: equipment as unknown as Record<string, unknown>[] },
  { name: "pg_listings", label: "PG Listings", emoji: "🏠", data: pgListings as unknown as Record<string, unknown>[] },
  { name: "teammate_posts", label: "Team Posts", emoji: "🧑‍💻", data: teammatePosts as unknown as Record<string, unknown>[] },
  { name: "skill_profiles", label: "Skills", emoji: "🎯", data: skillProfiles as unknown as Record<string, unknown>[] },
  { name: "events", label: "Events", emoji: "🎤", data: campusEvents as unknown as Record<string, unknown>[] },
  { name: "services", label: "Services", emoji: "🛠️", data: campusServices as unknown as Record<string, unknown>[] },
  { name: "opportunities", label: "Opportunities", emoji: "💼", data: opportunities as unknown as Record<string, unknown>[] },
  { name: "transactions", label: "Transactions", emoji: "💰", data: transactions as unknown as Record<string, unknown>[] },
  { name: "subscriptions", label: "Subscriptions", emoji: "📋", data: collegeSubscriptions as unknown as Record<string, unknown>[] },
  { name: "sponsorships", label: "Sponsorships", emoji: "📣", data: sponsorships as unknown as Record<string, unknown>[] },
  { name: "notifications", label: "Notifications", emoji: "🔔", data: notifications as unknown as Record<string, unknown>[] },
];

export default function SeedPage() {
  const [status, setStatus] = useState<Record<string, "idle" | "seeding" | "done" | "error">>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [seeding, setSeeding] = useState(false);
  const [completed, setCompleted] = useState(false);

  const seedCollection = async (col: SeedCollection) => {
    setStatus((prev) => ({ ...prev, [col.name]: "seeding" }));
    try {
      for (const item of col.data) {
        const id = (item as { id: string }).id;
        if (!id) continue;
        await setDoc(doc(db, col.name, id), item);
      }
      setStatus((prev) => ({ ...prev, [col.name]: "done" }));
      setCounts((prev) => ({ ...prev, [col.name]: col.data.length }));
    } catch (err) {
      console.error(`Failed to seed ${col.name}:`, err);
      setStatus((prev) => ({ ...prev, [col.name]: "error" }));
    }
  };

  const seedAll = async () => {
    setSeeding(true);
    setCompleted(false);
    for (const col of SEED_COLLECTIONS) {
      await seedCollection(col);
    }
    setSeeding(false);
    setCompleted(true);
  };

  const checkExisting = async () => {
    for (const col of SEED_COLLECTIONS) {
      try {
        const snap = await getDocs(collection(db, col.name));
        setCounts((prev) => ({ ...prev, [col.name]: snap.size }));
      } catch {
        setCounts((prev) => ({ ...prev, [col.name]: 0 }));
      }
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-black text-white">🌱 Seed Firestore</h1>
      <p className="mt-2 text-sm text-white/50">
        Push all mock data from the local data layer into Firestore. This is
        meant to be run once to bootstrap your database.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={seedAll}
          disabled={seeding}
          className="cl-btn cl-btn-primary px-5 py-2.5 text-sm"
        >
          {seeding ? "Seeding…" : "🚀 Seed All Collections"}
        </button>
        <button
          type="button"
          onClick={checkExisting}
          className="cl-btn cl-btn-ghost px-5 py-2.5 text-sm"
        >
          📊 Check Existing Counts
        </button>
      </div>

      {completed && (
        <div className="mt-6 rounded-xl border border-mint-400/30 bg-mint-500/10 px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-mint-400">
            ✅ Seeding complete!
          </p>
          <p className="mt-1 text-xs text-white/50">
            All mock data has been pushed to Firestore. The live site will now
            show real data from Firebase.
          </p>
        </div>
      )}

      {/* Collection status */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SEED_COLLECTIONS.map((col) => {
          const s = status[col.name] ?? "idle";
          const count = counts[col.name];

          return (
            <div
              key={col.name}
              className="cl-panel flex items-center gap-3 p-4"
            >
              <span className="text-xl">{col.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{col.label}</p>
                <p className="text-[11px] text-white/40">
                  {col.data.length} documents to seed
                  {count !== undefined && ` · ${count} in Firestore`}
                </p>
              </div>
              <span className="text-sm">
                {s === "idle" && "⏳"}
                {s === "seeding" && (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-500" />
                )}
                {s === "done" && "✅"}
                {s === "error" && "❌"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
