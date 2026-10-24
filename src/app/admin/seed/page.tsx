"use client";

/**
 * Seed Firestore from mock data.
 *
 * This component is rendered at `/admin/seed` and pushes all the seeded
 * local data into Firestore with a single click. It is meant to be run
 * once to bootstrap the database.
 */

import { useState } from "react";
import { doc, setDoc, collection, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// Import all mock data using the actual export names
import { colleges } from "@/lib/data/colleges";
import { profiles } from "@/lib/data/profiles";
import { bookListings } from "@/lib/data/bookListings";
import { listings } from "@/lib/data/listings";

interface SeedCollection {
  name: string;
  label: string;
  emoji: string;
  data: Record<string, unknown>[];
}

const SEED_COLLECTIONS: SeedCollection[] = [
  { name: "colleges", label: "Colleges", emoji: "🏛️", data: colleges as unknown as Record<string, unknown>[] },
  { name: "profiles", label: "Profiles", emoji: "👤", data: profiles as unknown as Record<string, unknown>[] },
  { name: "listings", label: "Second-hand items", emoji: "🛍️", data: listings as unknown as Record<string, unknown>[] },
];

const DEVICE_LISTINGS = listings.filter((listing) => listing.item_type === "device");
const BOOK_LISTINGS = bookListings;

export default function SeedPage() {
  const [status, setStatus] = useState<Record<string, "idle" | "seeding" | "done" | "error">>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [deviceSeedResult, setDeviceSeedResult] = useState("");
  const [bookSeedResult, setBookSeedResult] = useState("");
  const [countError, setCountError] = useState("");
  const [collectionErrors, setCollectionErrors] = useState<Record<string, string>>({});
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
      setCollectionErrors((prev) => ({ ...prev, [col.name]: "" }));
    } catch (err) {
      console.error(`Failed to seed ${col.name}:`, err);
      setStatus((prev) => ({ ...prev, [col.name]: "error" }));
      setCollectionErrors((prev) => ({ ...prev, [col.name]: "Seeding failed. Check the console and Firestore permissions." }));
    }
  };

  const seedAll = async () => {
    if (!window.confirm("Seed all collections? Existing sample documents with matching IDs will be overwritten.")) return;
    setSeeding(true);
    setCompleted(false);
    for (const col of SEED_COLLECTIONS) {
      await seedCollection(col);
    }
    setSeeding(false);
    setCompleted(true);
  };

  const seedDevices = async () => {
    setStatus((prev) => ({ ...prev, devices: "seeding" }));
    setDeviceSeedResult("");
    let added = 0;
    let skipped = 0;
    try {
      for (const listing of DEVICE_LISTINGS) {
        const reference = doc(db, "listings", listing.id);
        if ((await getDoc(reference)).exists()) {
          skipped += 1;
          continue;
        }
        await setDoc(reference, listing);
        added += 1;
      }
      setStatus((prev) => ({ ...prev, devices: "done" }));
      setDeviceSeedResult(`Added ${added} device listings; skipped ${skipped} that already existed.`);
    } catch (err) {
      console.error("Failed to seed sample device listings:", err);
      setStatus((prev) => ({ ...prev, devices: "error" }));
      setDeviceSeedResult("Could not seed device listings. Check the console and Firestore permissions.");
    }
  };

  const seedBooks = async () => {
    setStatus((prev) => ({ ...prev, books: "seeding" }));
    setBookSeedResult("");
    let added = 0;
    let skipped = 0;
    try {
      for (const listing of BOOK_LISTINGS) {
        const reference = doc(db, "listings", listing.id);
        if ((await getDoc(reference)).exists()) {
          skipped += 1;
          continue;
        }
        await setDoc(reference, listing);
        added += 1;
      }
      setStatus((prev) => ({ ...prev, books: "done" }));
      setBookSeedResult(`Added ${added} sample books; skipped ${skipped} that already existed.`);
    } catch (err) {
      console.error("Failed to seed sample book listings:", err);
      setStatus((prev) => ({ ...prev, books: "error" }));
      setBookSeedResult("Could not seed book listings. Check the console and Firestore permissions.");
    }
  };

  const checkExisting = async () => {
    setCountError("");
    for (const col of SEED_COLLECTIONS) {
      try {
        const snap = await getDocs(collection(db, col.name));
        setCounts((prev) => ({ ...prev, [col.name]: snap.size }));
      } catch (err) {
        console.error(`Failed to check ${col.name} count:`, err);
        setCountError("Could not check collection counts. Verify your connection and Firestore permissions.");
        return;
      }
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-black text-white">🌱 Seed Firestore</h1>
      <p className="mt-2 text-sm text-white/50">
        Seed the campus, profile, and second-hand item collections used by this site.
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
        <button
          type="button"
          onClick={seedDevices}
          disabled={seeding || status.devices === "seeding"}
          className="cl-btn cl-btn-ghost px-5 py-2.5 text-sm"
        >
          {status.devices === "seeding" ? "Adding devices…" : `📱 Seed ${DEVICE_LISTINGS.length} sample devices only`}
        </button>
        <button
          type="button"
          onClick={seedBooks}
          disabled={seeding || status.books === "seeding"}
          className="cl-btn cl-btn-ghost px-5 py-2.5 text-sm"
        >
          {status.books === "seeding" ? "Adding books…" : `📚 Seed ${BOOK_LISTINGS.length} sample books only`}
        </button>
      </div>

      {countError ? <p role="alert" className="mt-3 text-xs text-rose-300">{countError}</p> : null}

      {deviceSeedResult ? (
        <p role="status" className={`mt-3 text-xs ${status.devices === "error" ? "text-rose-300" : "text-mint-300"}`}>
          {deviceSeedResult}
        </p>
      ) : null}

      {bookSeedResult ? (
        <p role="status" className={`mt-3 text-xs ${status.books === "error" ? "text-rose-300" : "text-mint-300"}`}>
          {bookSeedResult}
        </p>
      ) : null}

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
                {collectionErrors[col.name] ? <p className="mt-1 text-[10px] text-rose-300">{collectionErrors[col.name]}</p> : null}
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
