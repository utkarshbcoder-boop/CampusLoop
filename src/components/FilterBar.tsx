"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { CloseIcon, SearchIcon, SlidersIcon } from "@/components/Icon";
import { cn } from "@/lib/utils";

/**
 * URL-driven filter bar.
 *
 * All state lives in the query string, so every filter is shareable, the back
 * button works, and the server component re-queries on each change. No
 * client-side shadow copy of the dataset to keep in sync.
 */

/**
 * Number formatters for `range` filters.
 *
 * These must stay serialisable strings, never callbacks: `FilterBar` is a
 * Client Component, and React cannot pass a function across the server/client
 * boundary. The actual formatting happens client-side in `formatRangeValue`.
 */
export type RangeFormat = "rupees" | "rupeesPerMonth" | "km" | "number";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatRangeValue(format: RangeFormat | undefined, n: number): string {
  switch (format) {
    case "rupeesPerMonth":
      return `${INR.format(n)}/mo`;
    case "km":
      return `${n} km`;
    case "number":
      return n.toLocaleString("en-IN");
    case "rupees":
    default:
      return INR.format(n);
  }
}

export type FilterDef =
  | { kind: "select"; key: string; label: string; options: { value: string; label: string }[]; defaultValue: string }
  | {
      kind: "range";
      key: string;
      label: string;
      min: number;
      max: number;
      step: number;
      defaultValue: number;
      format?: RangeFormat;
    }
  | { kind: "chips"; key: string; label: string; options: { value: string; label: string }[]; defaultValue: string[]; max?: number }
  | { kind: "toggle"; key: string; label: string; defaultValue: boolean };

export function FilterBar({
  filters,
  placeholder = "Search…",
  resultLabel,
  extra,
}: {
  filters: FilterDef[];
  placeholder?: string;
  resultLabel: string;
  extra?: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  // Keep the input in sync when navigation changes the query string.
  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  const commit = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      // Drop filters whose value is back at the default so URLs stay clean.
      params.forEach((value, key) => {
        const def = filters.find((f) => f.key === key);
        if (!def) return;
        if (def.kind === "toggle" && value === "true") params.delete(key);
        if (def.kind === "select" && value === def.defaultValue) params.delete(key);
        if (def.kind === "chips" && value === "") params.delete(key);
      });
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `?${qs}` : "?", { scroll: false });
      });
    },
    [filters, router, searchParams],
  );

  const setValue = useCallback(
    (key: string, value: string | string[] | boolean) => {
      commit((params) => {
        if (Array.isArray(value)) {
          if (value.length === 0) params.delete(key);
          else params.set(key, value.join(","));
          return;
        }
        if (typeof value === "boolean") {
          if (value) params.set(key, "true");
          else params.delete(key);
          return;
        }
        if (value === "") params.delete(key);
        else params.set(key, value);
      });
    },
    [commit],
  );

  const activeCount = useMemo(() => {
    let count = 0;
    for (const def of filters) {
      const value = searchParams.get(def.key);
      if (value === null) continue;
      if (def.kind === "select" && value !== def.defaultValue) count += 1;
      else if (def.kind === "range" && Number(value) !== def.defaultValue) count += 1;
      else if (def.kind === "chips" && value !== "") count += 1;
      else if (def.kind === "toggle" && value === "true") count += 1;
    }
    if (searchParams.get("q")) count += 1;
    return count;
  }, [filters, searchParams]);

  const hasFilters = filters.length > 0;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setValue("q", search.trim());
  }

  return (
    <div className="cl-panel sticky top-16 z-40 p-3 sm:p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={submitSearch} className="relative min-w-0 flex-1 sm:min-w-64">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/35" width={17} height={17} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={submitSearch}
              placeholder={placeholder}
              className="cl-input pl-9"
              aria-label={placeholder}
            />
          </form>

          {hasFilters ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className={cn("cl-btn cl-btn-ghost shrink-0", expanded && "border-brand-400/40 text-brand-200")}
              aria-expanded={expanded}
            >
              <SlidersIcon width={15} height={15} />
              Filters
              {activeCount > 0 ? (
                <span className="ml-0.5 rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">
                  {activeCount}
                </span>
              ) : null}
            </button>
          ) : null}

          {activeCount > 0 ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                startTransition(() => router.replace("?", { scroll: false }));
              }}
              className="cl-btn cl-btn-ghost shrink-0"
            >
              <CloseIcon width={15} height={15} />
              Clear
            </button>
          ) : null}

          <div className="ml-auto flex shrink-0 items-center gap-2 text-xs text-white/45">
            {isPending ? (
              <span className="cl-chip cl-chip-brand">Updating…</span>
            ) : (
              <span className="cl-chip">{resultLabel}</span>
            )}
          </div>
        </div>

        {expanded && hasFilters ? (
          <div className="grid gap-4 border-t border-white/8 pt-3 sm:grid-cols-2 lg:grid-cols-4">
            {filters.map((def) => (
              <FilterControl key={def.key} def={def} value={searchParams.get(def.key)} onChange={setValue} />
            ))}
            {extra}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FilterControl({
  def,
  value,
  onChange,
}: {
  def: FilterDef;
  value: string | null;
  onChange: (key: string, value: string | string[] | boolean) => void;
}) {
  const label = (
    <span className="text-[11px] font-semibold tracking-wider text-white/40 uppercase">{def.label}</span>
  );

  if (def.kind === "select") {
    return (
      <label className="flex flex-col gap-1.5">
        {label}
        <select
          className="cl-input"
          value={value ?? def.defaultValue}
          onChange={(e) => onChange(def.key, e.target.value)}
        >
          {def.options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-ink-900">
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (def.kind === "range") {
    const current = value ? Number(value) : def.defaultValue;
    return (
      <label className="flex flex-col gap-1.5">
        {label}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={def.min}
            max={def.max}
            step={def.step}
            value={current}
            onChange={(e) => onChange(def.key, e.target.value)}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-brand-500"
            aria-label={def.label}
          />
          <span className="w-16 shrink-0 text-right text-xs font-medium text-white/70">
            {formatRangeValue(def.format, current)}
          </span>
        </div>
      </label>
    );
  }

  if (def.kind === "chips") {
    const selected = value ? value.split(",").filter(Boolean) : [];
    const max = def.max ?? 6;
    return (
      <div className="flex flex-col gap-1.5">
        {label}
        <div className="flex flex-wrap gap-1.5">
          {def.options.map((opt) => {
            const on = selected.includes(opt.value);
            const full = selected.length >= max && !on;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={full}
                onClick={() =>
                  onChange(
                    def.key,
                    on ? selected.filter((s) => s !== opt.value) : [...selected, opt.value],
                  )
                }
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                  on
                    ? "border-brand-400/50 bg-brand-500/18 text-brand-200"
                    : full
                      ? "cursor-not-allowed border-white/6 text-white/25"
                      : "border-white/10 bg-white/4 text-white/55 hover:border-white/25 hover:text-white",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {selected.length > 0 ? (
          <button
            type="button"
            onClick={() => onChange(def.key, [])}
            className="self-start text-[11px] text-white/40 underline underline-offset-2 transition hover:text-white"
          >
            clear {selected.length} selected
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <label className="flex cursor-pointer items-center gap-2.5 self-end pb-1">
      <input
        type="checkbox"
        checked={value === "true"}
        onChange={(e) => onChange(def.key, e.target.checked)}
        className="h-4 w-4 cursor-pointer accent-brand-500"
      />
      <span className="text-sm text-white/75">{def.label}</span>
    </label>
  );
}

/**
 * Read-only active-filter summary. Self-contained: it reads the query string
 * itself so pages can pass plain data across the server/client boundary.
 */
export function ActiveFilters({ labels }: { labels: { key: string; label: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (labels.length === 0) return null;

  function remove(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] text-white/35">Active:</span>
      {labels.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => remove(item.key)}
          className="cl-chip cl-chip-brand transition hover:border-rose-400/50 hover:text-rose-200"
          title={`Remove the ${item.key} filter`}
        >
          {item.label}
          <span aria-hidden>✕</span>
        </button>
      ))}
    </div>
  );
}
