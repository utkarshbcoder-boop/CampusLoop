"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  updateHomeListing,
  updateMarketplaceListing,
  type HomeListingStatus,
  type HomeMarketplaceListing,
} from "@/lib/firebase/marketplace";
import type { BookCondition, Listing } from "@/lib/types";

const CONDITIONS: { value: BookCondition; label: string }[] = [
  { value: "like_new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "heavy_notes", label: "Heavy notes / well used" },
];

const HOME_STATUSES: { value: HomeListingStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "rented", label: "Rented" },
  { value: "sold", label: "Sold" },
  { value: "withdrawn", label: "Withdrawn" },
];

const FURNISHED_OPTIONS = ["Full", "Semi", "Unfurnished"] as const;

const MAX_AMOUNT = 1_000_000_000;

export type ListingEditTarget =
  | { kind: "item"; sellerId: string; listing: Listing }
  | { kind: "home"; ownerId: string; home: HomeMarketplaceListing };

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function friendlyError(cause: unknown, fallback: string): string {
  if (cause instanceof Error && cause.message.length > 0 && !("code" in cause)) {
    return cause.message;
  }
  return fallback;
}

/**
 * Modal editor for the mutable fields of an owned listing or home.
 * Save goes through the ownership-checked helpers in `@/lib/firebase/marketplace`,
 * so the Firestore rules allowlist is the final authority.
 */
export function ListingEditDialog({
  target,
  onClose,
  onSaved,
}: {
  target: ListingEditTarget;
  onClose: () => void;
  onSaved: () => void;
}) {
  const item = target.kind === "item" ? target.listing : null;
  const home = target.kind === "home" ? target.home : null;
  const isItem = target.kind === "item";
  const isDevice = item?.item_type === "device";

  const [title, setTitle] = useState(item?.title ?? home?.title ?? "");
  const [author, setAuthor] = useState(item?.author ?? "");
  const [edition, setEdition] = useState(item?.edition ?? "");
  const [subject, setSubject] = useState(item?.subject ?? "");
  const [condition, setCondition] = useState<BookCondition>(item?.condition ?? "good");
  const [price, setPrice] = useState(String(item?.price ?? home?.price ?? ""));
  const [mrp, setMrp] = useState(String(item?.mrp ?? ""));
  const [negotiable, setNegotiable] = useState(item?.negotiable ?? false);
  const [pickup, setPickup] = useState(item?.pickup_location ?? "");
  const [description, setDescription] = useState(
    item?.description ?? home?.description ?? "",
  );
  const [highlights, setHighlights] = useState((item?.highlights ?? []).join(", "));
  const [tags, setTags] = useState((item?.tags ?? []).join(", "));
  const [locality, setLocality] = useState(home?.locality ?? "");
  const [beds, setBeds] = useState(String(home?.beds ?? ""));
  const [baths, setBaths] = useState(String(home?.baths ?? ""));
  const [furnished, setFurnished] = useState<
    "Full" | "Semi" | "Unfurnished"
  >(home?.furnished ?? "Unfurnished");
  const [distanceKm, setDistanceKm] = useState(String(home?.distanceKm ?? 0));
  const [available, setAvailable] = useState(home?.available ?? "");
  const [owner, setOwner] = useState(home?.owner ?? "");
  const [status, setStatus] = useState<HomeMarketplaceListing["status"]>(home?.status ?? "available");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (target.kind === "item") {
      const trimmedTitle = title.trim();
      const trimmedPickup = pickup.trim();
      const priceValue = Number(price);
      const mrpValue = Number(mrp);
      if (trimmedTitle.length < 1 || trimmedTitle.length > 300) {
        setError("Enter a title between 1 and 300 characters.");
        return;
      }
      if (!Number.isFinite(priceValue) || priceValue < 1 || priceValue > MAX_AMOUNT) {
        setError("Enter a price between ₹1 and ₹1,000,000,000.");
        return;
      }
      if (!Number.isFinite(mrpValue) || mrpValue < 0 || mrpValue > MAX_AMOUNT) {
        setError("Enter an MRP between ₹0 and ₹1,000,000,000.");
        return;
      }
      if (trimmedPickup.length < 1 || trimmedPickup.length > 500) {
        setError("Enter a pickup location between 1 and 500 characters.");
        return;
      }
      if (description.length > 10_000) {
        setError("Keep the description under 10,000 characters.");
        return;
      }
      setBusy(true);
      try {
        await updateMarketplaceListing(target.listing.id, target.sellerId, {
          title: trimmedTitle,
          author: author.trim(),
          edition: edition.trim(),
          subject: subject.trim(),
          condition,
          price: priceValue,
          mrp: mrpValue,
          negotiable,
          pickup_location: trimmedPickup,
          description,
          highlights: splitList(highlights),
          tags: splitList(tags),
        });
        setSuccess("Changes saved.");
        onSaved();
      } catch (cause) {
        console.error("Failed to save listing changes:", cause);
        setError(friendlyError(cause, "Your changes could not be saved. Please try again."));
      } finally {
        setBusy(false);
      }
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedLocality = locality.trim();
    const priceValue = Number(price);
    const bedsValue = Number(beds);
    const bathsValue = Number(baths);
    const distanceValue = Number(distanceKm);
    if (trimmedTitle.length < 1 || trimmedTitle.length > 300) {
      setError("Enter a title between 1 and 300 characters.");
      return;
    }
    if (trimmedLocality.length < 1 || trimmedLocality.length > 300) {
      setError("Enter a locality between 1 and 300 characters.");
      return;
    }
    if (!Number.isFinite(priceValue) || priceValue < 1 || priceValue > MAX_AMOUNT) {
      setError("Enter a price between ₹1 and ₹1,000,000,000.");
      return;
    }
    if (!Number.isInteger(bedsValue) || bedsValue < 0 || bedsValue > 100) {
      setError("Enter a valid bedroom count.");
      return;
    }
    if (!Number.isInteger(bathsValue) || bathsValue < 0 || bathsValue > 100) {
      setError("Enter a valid bathroom count.");
      return;
    }
    if (!Number.isFinite(distanceValue) || distanceValue < 0 || distanceValue > 1000) {
      setError("Enter a distance between 0 and 1000 km.");
      return;
    }
    if (description.length > 2000) {
      setError("Keep the description under 2,000 characters.");
      return;
    }
    setBusy(true);
    try {
      await updateHomeListing(target.home.id, target.ownerId, {
        title: trimmedTitle,
        locality: trimmedLocality,
        price: priceValue,
        beds: bedsValue,
        baths: bathsValue,
        furnished,
        distanceKm: distanceValue,
        available,
        owner,
        description,
        ...(status ? { status } : {}),
      });
      setSuccess("Changes saved.");
      onSaved();
    } catch (cause) {
      console.error("Failed to save home listing changes:", cause);
      setError(friendlyError(cause, "Your changes could not be saved. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="listing-edit-title"
        className="cl-panel cl-panel-solid max-h-[85vh] w-full max-w-lg overflow-y-auto p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="listing-edit-title" className="text-xl font-bold text-white">
              {isItem ? "Edit your listing" : "Edit your property listing"}
            </h2>
            <p className="mt-1 text-sm text-white/55">
              {isItem
                ? "Update what buyers see. Changes appear on the listing right away."
                : "Update what renters and buyers see. Changes appear right away."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit dialog"
            className="cl-btn cl-btn-ghost px-2.5 py-1 text-xs"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] tracking-wider text-white/40 uppercase">Title</span>
            <input
              className="cl-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={300}
              required
            />
          </label>

          {isItem ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] tracking-wider text-white/40 uppercase">
                    {isDevice ? "Brand" : "Author"}
                  </span>
                  <input className="cl-input" value={author} onChange={(event) => setAuthor(event.target.value)} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] tracking-wider text-white/40 uppercase">
                    {isDevice ? "Category" : "Edition"}
                  </span>
                  <input className="cl-input" value={edition} onChange={(event) => setEdition(event.target.value)} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] tracking-wider text-white/40 uppercase">
                    {isDevice ? "Details" : "Subject"}
                  </span>
                  <input className="cl-input" value={subject} onChange={(event) => setSubject(event.target.value)} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] tracking-wider text-white/40 uppercase">Condition</span>
                  <select
                    className="cl-input"
                    value={condition}
                    onChange={(event) => setCondition(event.target.value as BookCondition)}
                  >
                    {CONDITIONS.map((option) => (
                      <option key={option.value} value={option.value} className="bg-ink-900">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          ) : (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] tracking-wider text-white/40 uppercase">Locality</span>
                <input
                  className="cl-input"
                  value={locality}
                  onChange={(event) => setLocality(event.target.value)}
                  maxLength={300}
                  required
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] tracking-wider text-white/40 uppercase">Bedrooms</span>
                  <input
                    className="cl-input"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={beds}
                    onChange={(event) => setBeds(event.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] tracking-wider text-white/40 uppercase">Bathrooms</span>
                  <input
                    className="cl-input"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={baths}
                    onChange={(event) => setBaths(event.target.value)}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] tracking-wider text-white/40 uppercase">Furnishing</span>
                  <select
                    className="cl-input"
                    value={furnished}
                    onChange={(event) =>
                      setFurnished(event.target.value as "Full" | "Semi" | "Unfurnished")
                    }
                  >
                    {FURNISHED_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-ink-900">
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] tracking-wider text-white/40 uppercase">
                    Distance from campus (km)
                  </span>
                  <input
                    className="cl-input"
                    type="number"
                    min={0}
                    max={1000}
                    step={0.1}
                    value={distanceKm}
                    onChange={(event) => setDistanceKm(event.target.value)}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] tracking-wider text-white/40 uppercase">Available from</span>
                  <input
                    className="cl-input"
                    value={available}
                    onChange={(event) => setAvailable(event.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] tracking-wider text-white/40 uppercase">Listed by</span>
                  <input
                    className="cl-input"
                    value={owner}
                    onChange={(event) => setOwner(event.target.value)}
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] tracking-wider text-white/40 uppercase">Status</span>
                <select
                  className="cl-input"
                  value={status ?? "available"}
                  onChange={(event) =>
                    setStatus(event.target.value as NonNullable<HomeMarketplaceListing["status"]>)
                  }
                >
                  {HOME_STATUSES.map((option) => (
                    <option key={option.value} value={option.value} className="bg-ink-900">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] tracking-wider text-white/40 uppercase">
                {home && home.mode === "rent" ? "Monthly rent (₹)" : "Price (₹)"}
              </span>
              <input
                className="cl-input"
                type="number"
                min={1}
                step={1}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
              />
            </label>
            {isItem ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] tracking-wider text-white/40 uppercase">MRP (₹)</span>
                <input
                  className="cl-input"
                  type="number"
                  min={0}
                  step={1}
                  value={mrp}
                  onChange={(event) => setMrp(event.target.value)}
                />
              </label>
            ) : null}
          </div>

          {isItem ? (
            <>
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={negotiable}
                  onChange={(event) => setNegotiable(event.target.checked)}
                  className="h-4 w-4 accent-brand-400"
                />
                Price is negotiable
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] tracking-wider text-white/40 uppercase">Pickup address</span>
                <input
                  className="cl-input"
                  value={pickup}
                  onChange={(event) => setPickup(event.target.value)}
                  maxLength={500}
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] tracking-wider text-white/40 uppercase">Highlights (comma separated)</span>
                <input
                  className="cl-input"
                  value={highlights}
                  onChange={(event) => setHighlights(event.target.value)}
                  placeholder="e.g. No markings, Includes notes"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] tracking-wider text-white/40 uppercase">Tags (comma separated)</span>
                <input
                  className="cl-input"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="e.g. semester 4, cse"
                />
              </label>
            </>
          ) : null}

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] tracking-wider text-white/40 uppercase">
              {isItem ? "More details" : "About this place"}
            </span>
            <textarea
              className="cl-input min-h-24 resize-y"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={isItem ? 10_000 : 2000}
              placeholder="Add details buyers should know."
            />
          </label>

          {error ? <p role="alert" className="text-sm text-rose-300">{error}</p> : null}
          {success ? <p role="status" className="text-sm text-mint-300">{success}</p> : null}

          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onClose} className="cl-btn cl-btn-ghost" disabled={busy}>
              {success ? "Close" : "Cancel"}
            </button>
            <button type="submit" disabled={busy} className="cl-btn cl-btn-primary disabled:opacity-50">
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
