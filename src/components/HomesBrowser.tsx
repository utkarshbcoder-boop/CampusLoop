"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SaveButton } from "@/components/Actions";
import { PinIcon } from "@/components/Icon";
import { rupees } from "@/lib/format";
import { HOME_TYPE_LABELS, type Home, type HomeType } from "@/lib/data/homes";
import { useCollection } from "@/lib/firebase/hooks";
import type { HomeMarketplaceListing } from "@/lib/firebase/marketplace";

const TYPE_OPTIONS: { value: "all" | HomeType; label: string }[] = [
  { value: "all", label: "All home types" },
  { value: "pg", label: "PG" },
  { value: "separate_room", label: "Separate room" },
  { value: "1rk", label: "1 RK" },
  { value: "1bhk", label: "1 BHK" },
  { value: "2bhk", label: "2 BHK" },
  { value: "3bhk", label: "3 BHK" },
  { value: "4bhk", label: "4 BHK" },
];

export function HomesBrowser({ homes }: { homes: Home[] }) {
  const userHomes = useCollection<HomeMarketplaceListing>("home_listings");
  const allHomes = useMemo<Home[]>(() => [
    ...homes,
    ...userHomes.data.map(({ id, title, locality, type, mode, price, beds, baths, furnished, distanceKm, available, owner }) => ({
      id, title, locality, type, mode, price, beds, baths, furnished, distanceKm, available, owner,
    })),
  ], [homes, userHomes.data]);
  const [mode, setMode] = useState<"all" | "rent" | "sale">("all");
  const [type, setType] = useState<"all" | HomeType>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return allHomes.filter((h) => {
      if (mode !== "all" && h.mode !== mode) return false;
      if (type !== "all" && h.type !== type) return false;
      if (needle && !`${h.title} ${h.locality}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [allHomes, mode, type, q]);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className="cl-input flex-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search locality — try “Koramangala” or “Indiranagar”"
        />
        <select className="cl-input sm:w-48" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
          <option value="all" className="bg-ink-900">Rent or buy</option>
          <option value="rent" className="bg-ink-900">For rent</option>
          <option value="sale" className="bg-ink-900">For sale</option>
        </select>
        <select className="cl-input sm:w-48" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
          {TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value} className="bg-ink-900">
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-4 text-xs text-white/40">
        {filtered.length} {filtered.length === 1 ? "home" : "homes"} found
      </p>
      {userHomes.error ? <p role="alert" className="mt-2 text-xs text-rose-300">Could not load newly listed homes.</p> : null}

      {filtered.length === 0 ? (
        <div className="cl-panel mt-4 p-10 text-center text-sm text-white/50">
          Nothing matches — try a different locality or home type.
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((h) => (
            <div key={h.id} className="cl-panel cl-panel-hover flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="cl-chip cl-chip-brand">{HOME_TYPE_LABELS[h.type]}</span>
                <span className={`cl-chip ${h.mode === "rent" ? "cl-chip-mint" : "cl-chip-flare"}`}>
                  {h.mode === "rent" ? "For rent" : "For sale"}
                </span>
              </div>
              <h3 className="text-sm font-semibold leading-snug text-white">{h.title}</h3>
              <p className="flex items-center gap-1 text-xs text-white/45">
                <PinIcon width={12} height={12} />
                {h.locality}{h.distanceKm > 0 ? ` · ${h.distanceKm} km from campus` : ""}
              </p>
              <div className="flex items-center gap-3 text-xs text-white/55">
                <span>{h.beds} bed</span>·<span>{h.baths} bath</span>·<span>{h.furnished}</span>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/8 pt-3">
                <p className="text-lg font-bold text-white">
                  {rupees(h.price)}
                  {h.mode === "rent" ? <span className="text-xs font-normal text-white/45">/mo</span> : null}
                </p>
                <div className="relative z-10 flex items-center gap-2">
                  <SaveButton id={`home:${h.id}`} label="Star" className="px-2.5 py-1.5 text-xs" />
                  <Link href={h.mode === "rent" ? "/homes" : "/sell"} className="cl-btn cl-btn-ghost px-3 py-1.5 text-xs">
                    {h.mode === "rent" ? "Contact" : "Make offer"}
                  </Link>
                </div>
              </div>
              <p className="text-[11px] text-white/35">
                Available {h.available} · Listed by {h.owner}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
