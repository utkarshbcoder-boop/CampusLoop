"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { colleges } from "@/lib/data/colleges";
import {
  campusOptions,
  customCampusId,
  OTHER_CAMPUS_VALUE,
} from "@/lib/data/campusOptions";
import { createHomeMarketplaceListing, createMarketplaceListing } from "@/lib/firebase/marketplace";
import { rupees } from "@/lib/format";
import { DEVICE_CATEGORIES } from "@/lib/marketplaceCategories";
import { readSettingsPreferences } from "@/lib/settingsPreferences";
import type { BookCondition, DeviceCategory, HomeListingMode, HomeListingType } from "@/lib/types";

const CONDITIONS: { value: BookCondition; label: string }[] = [
  { value: "like_new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "heavy_notes", label: "Heavy notes / well used" },
];

type SellKind = "book" | "device" | "home";

export function SellForm({ initialKind }: { initialKind: SellKind | "both" }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [kind, setKind] = useState<SellKind>(initialKind === "both" ? "book" : initialKind);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState<BookCondition>("good");
  const [deviceType, setDeviceType] = useState<DeviceCategory>("laptop");
  const [address, setAddress] = useState("");
  const [homeDescription, setHomeDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [edition, setEdition] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [collegeId, setCollegeId] = useState(colleges[0]?.id ?? "");
  const [customCollegeName, setCustomCollegeName] = useState("");
  const [otherCampusSelected, setOtherCampusSelected] = useState(false);
  const [homeMode, setHomeMode] = useState<HomeListingMode>("rent");
  const [homeType, setHomeType] = useState<HomeListingType>("separate_room");
  const [beds, setBeds] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const amount = Number(price);
    if (
      !title.trim()
      || !Number.isFinite(amount)
      || amount <= 0
      || !address.trim()
      || (kind !== "home" && (!collegeId || collegeId === OTHER_CAMPUS_VALUE || !customCollegeName.trim() && otherCampusSelected))
      || (kind === "home" && (!Number.isInteger(Number(beds)) || Number(beds) < 1))
    ) {
      setError("Enter a valid title, price, address, and campus or bedroom count.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const now = new Date().toISOString();
      if (kind === "home") {
        const id = await createHomeMarketplaceListing({
          title: title.trim(),
          locality: address.trim(),
          type: homeType,
          mode: homeMode,
          price: amount,
          beds: Number(beds),
          baths: 1,
          furnished: "Unfurnished",
          distanceKm: 0,
          available: "Immediate",
          owner: readSettingsPreferences(user.uid).showNameOnHomeListings
            ? user.displayName || "CampusLoop member"
            : "CampusLoop member",
          owner_id: user.uid,
          description: homeDescription.trim(),
          created_at: now,
        });
        setCreatedId(id);
        router.refresh();
        return;
      }
      const itemType = kind === "device" ? "device" : "book";
      const id = await createMarketplaceListing({
        item_type: itemType,
        ...(itemType === "device" ? { device_type: deviceType } : {}),
        title: title.trim(),
        author: author.trim() || (itemType === "device" ? "Device" : "Student listing"),
        edition: edition.trim() || "Used",
        subject: subject.trim() || (itemType === "device" ? "Electronics" : "General"),
        semester: "all",
        branch: "all",
        kind: "sell",
        condition,
        price: amount,
        mrp: amount,
        negotiable: false,
        seller_id: user.uid,
        college_id: collegeId,
        pickup_location: address.trim(),
        status: "available",
        description: description.trim() || `Second-hand ${itemType} listing from ${user.displayName || "a student"}.`,
        highlights: [],
        tags: [],
        hue: itemType === "device" ? 210 : 32,
        emoji: itemType !== "device" ? "📚" : deviceType === "mobile" || deviceType === "tablet" ? "📱" : "💻",
        boosted: false,
        views: 0,
        saves: 0,
        created_at: now,
      });
      setCreatedId(id);
      router.refresh();
    } catch (cause) {
      console.error("Failed to create marketplace listing:", cause);
      setError("Your listing could not be saved. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="cl-panel cl-panel-solid p-6 text-sm text-white/50">Checking your account…</div>;
  }

  if (!user) {
    return (
      <div className="cl-panel cl-panel-solid flex flex-col gap-3 p-6">
        <h2 className="text-base font-semibold text-white">Sign in to list an item</h2>
        <p className="text-sm text-white/55">Listings are tied to your account so you can manage them and see buyer interest.</p>
        <Link href="/login" className="cl-btn cl-btn-primary self-start">Sign in</Link>
      </div>
    );
  }

  if (createdId) {
    return (
      <div className="cl-panel cl-panel-solid flex flex-col gap-3 p-6">
        <p className="text-base font-semibold text-mint-400">Your listing is live</p>
        <p className="text-sm leading-relaxed text-white/60">
          {title} · {rupees(Number(price))} · {address}. {kind === "home" ? "Your home listing is available in Homes & Rooms." : "Buyers can now see the listing and register interest."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={kind === "home" ? "/homes" : "/marketplace"} className="cl-btn cl-btn-primary">View listing</Link>
          {kind !== "home" ? <Link href="/my-listings" className="cl-btn cl-btn-ghost">Manage my listings</Link> : null}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="cl-panel cl-panel-solid flex flex-col gap-4 p-6">
      <div className="grid grid-cols-3 gap-2">
        {([
          { value: "book", label: "Sell books" },
          { value: "device", label: "Sell a device" },
          { value: "home", label: "Home / room" },
        ] as const).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setKind(option.value);
              window.history.replaceState(null, "", `/sell?type=${option.value}`);
              window.dispatchEvent(new Event("selltype"));
            }}
            className={`cl-btn justify-center ${kind === option.value ? "cl-btn-primary" : "cl-btn-ghost"} disabled:opacity-40`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {kind === "device" ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-[11px] tracking-wider text-white/40 uppercase">Choose device type</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {DEVICE_CATEGORIES.filter((category) => category.value !== "other").map((category) => (
              <button
                key={category.value}
                type="button"
                aria-pressed={deviceType === category.value}
                onClick={() => setDeviceType(category.value)}
                className={`cl-btn justify-center ${deviceType === category.value ? "cl-btn-primary" : "cl-btn-ghost"}`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}
      {kind === "home" ? (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] tracking-wider text-white/40 uppercase">Listing type</span>
            <select className="cl-input" value={homeType} onChange={(event) => setHomeType(event.target.value as HomeListingType)}>
              <option value="pg">PG</option><option value="separate_room">Separate room</option>
              <option value="1rk">1 RK</option><option value="1bhk">1 BHK</option><option value="2bhk">2 BHK</option>
              <option value="3bhk">3 BHK</option><option value="4bhk">4 BHK</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] tracking-wider text-white/40 uppercase">Rent or sale</span>
            <select className="cl-input" value={homeMode} onChange={(event) => setHomeMode(event.target.value as HomeListingMode)}>
              <option value="rent">For rent</option><option value="sale">For sale</option>
            </select>
          </label>
        </div>
      ) : null}
      {kind === "home" ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] tracking-wider text-white/40 uppercase">Property details</span>
          <textarea
            className="cl-input min-h-24 resize-y"
            value={homeDescription}
            onChange={(event) => setHomeDescription(event.target.value)}
            placeholder="Describe the place, amenities, terms, and any other useful details."
            maxLength={2000}
          />
        </label>
      ) : null}
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] tracking-wider text-white/40 uppercase">Title</span>
        <input
          className="cl-input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={kind === "book"
            ? "e.g. Introduction to Algorithms"
            : kind === "device"
              ? deviceType === "mobile"
                ? "e.g. iPhone 13, 128 GB"
                : deviceType === "tablet"
                  ? "e.g. Samsung Galaxy Tab S8"
                  : "e.g. Dell Latitude 5420, 16 GB RAM"
              : "e.g. Furnished room near campus"}
          required
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] tracking-wider text-white/40 uppercase">{kind === "home" ? homeMode === "rent" ? "Monthly rent (₹)" : "Sale price (₹)" : "Price (₹)"}</span>
          <input className="cl-input" type="number" min={1} step={1} value={price} onChange={(event) => setPrice(event.target.value)} placeholder="450" required />
        </label>
        {kind !== "home" ? <label className="flex flex-col gap-1.5">
          <span className="text-[11px] tracking-wider text-white/40 uppercase">Condition</span>
          <select className="cl-input" value={condition} onChange={(event) => setCondition(event.target.value as BookCondition)}>
            {CONDITIONS.map((option) => <option key={option.value} value={option.value} className="bg-ink-900">{option.label}</option>)}
          </select>
        </label> : (
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] tracking-wider text-white/40 uppercase">Bedrooms</span>
            <input className="cl-input" type="number" min={1} max={20} value={beds} onChange={(event) => setBeds(event.target.value)} />
          </label>
        )}
      </div>
      {kind !== "home" ? <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] tracking-wider text-white/40 uppercase">{kind === "book" ? "Author" : "Brand"}</span>
          <input className="cl-input" value={author} onChange={(event) => setAuthor(event.target.value)} placeholder={kind === "book" ? "Author name" : "Brand"} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] tracking-wider text-white/40 uppercase">{kind === "book" ? "Edition" : "Category"}</span>
          <input className="cl-input" value={edition} onChange={(event) => setEdition(event.target.value)} placeholder={kind === "book" ? "Edition / year" : "Laptop, phone, calculator…"} />
        </label>
      </div> : null}
      {kind !== "home" ? <label className="flex flex-col gap-1.5">
        <span className="text-[11px] tracking-wider text-white/40 uppercase">{kind === "book" ? "Subject" : "Description / specs"}</span>
        <input className="cl-input" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder={kind === "book" ? "e.g. Computer Science" : "e.g. 16 GB RAM, 512 GB SSD"} />
      </label> : null}
      {kind !== "home" ? <label className="flex flex-col gap-1.5">
        <span className="text-[11px] tracking-wider text-white/40 uppercase">More details</span>
        <textarea className="cl-input min-h-20 resize-y" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add details buyers should know." />
      </label> : null}
      {kind !== "home" ? <label className="flex flex-col gap-1.5">
        <span className="text-[11px] tracking-wider text-white/40 uppercase">Campus</span>
        <select
          className="cl-input"
          value={otherCampusSelected ? OTHER_CAMPUS_VALUE : collegeId}
          onChange={(event) => {
            const value = event.target.value;
            const isOther = value === OTHER_CAMPUS_VALUE;
            setOtherCampusSelected(isOther);
            if (isOther) {
              setCollegeId(
                customCollegeName.trim()
                  ? customCampusId(customCollegeName)
                  : OTHER_CAMPUS_VALUE,
              );
              return;
            }
            setCustomCollegeName("");
            setCollegeId(value);
          }}
          required
        >
          {campusOptions.map((campus) => <option key={campus.id} value={campus.id} className="bg-ink-900">{campus.name}</option>)}
          <option value={OTHER_CAMPUS_VALUE} className="bg-ink-900">Other</option>
        </select>
        {otherCampusSelected ? (
          <input
            className="cl-input"
            value={customCollegeName}
            onChange={(event) => {
              const value = event.target.value;
              setCustomCollegeName(value);
              setCollegeId(value.trim() ? customCampusId(value) : OTHER_CAMPUS_VALUE);
            }}
            placeholder="Enter your college name"
            maxLength={120}
            required
          />
        ) : null}
      </label> : null}
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] tracking-wider text-white/40 uppercase">{kind === "home" ? "Home address / locality" : "Pickup shop / address"}</span>
        <input
          className="cl-input"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder={kind === "home" ? "e.g. Main Market, Block C" : "e.g. Shop 12, Main Market, Block C"}
          required
        />
      </label>
      {error ? <p role="alert" className="text-sm text-rose-300">{error}</p> : null}
      <button type="submit" disabled={busy} className="cl-btn cl-btn-primary justify-center disabled:opacity-50">
        {busy ? "Saving listing…" : kind === "book" ? "Publish book listing" : kind === "device" ? "Publish device listing" : "Publish home / room listing"}
      </button>
      <p className="text-xs text-white/40">{kind === "home" ? "Your home listing will appear in Homes & Rooms after it is saved." : "Your listing will appear in the second-hand marketplace. Manage buyer interest from My Listings."}</p>
    </form>
  );
}
