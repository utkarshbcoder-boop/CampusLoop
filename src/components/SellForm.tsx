"use client";

import { useState } from "react";
import Link from "next/link";
import { BookIcon, HomeIcon, LaptopIcon } from "@/components/Icon";
import { rupees } from "@/lib/format";
import { useCampusLoop } from "@/lib/store";
import { cn } from "@/lib/utils";

const CONDITIONS = [
  { value: "like_new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "heavy_notes", label: "Heavy notes / well used" },
];

export function SellForm({ initialKind }: { initialKind: "book" | "device" | "home" }) {
  const { premium, hydrated, feeFreeSalesUsed, recordFeeFreeSale, pushToast } = useCampusLoop();
  const [kind, setKind] = useState<"book" | "device" | "home">(initialKind);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("good");
  const [address, setAddress] = useState("");
  const [done, setDone] = useState(false);
  const [demoSaleRecorded, setDemoSaleRecorded] = useState(false);
  const [supportRequested, setSupportRequested] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price || !address.trim()) return;
    setDone(true);
    pushToast({
      title: kind === "book" ? "Book listed" : kind === "device" ? "Device listed" : "Home listed",
      body: `"${title.trim()}" for ${rupees(Number(price))} at ${address.trim()} is now live on CampusLoop.${premium ? " Premium demo: your listing boost is active for 7 days." : ""} Demo mode — no real listing was created.`,
      tone: premium ? "premium" : "success",
    });
  };

  if (done) {
    return (
      <div className="cl-panel cl-panel-solid flex flex-col gap-3 p-6">
        <p className="text-base font-semibold text-mint-400">Your listing is live</p>
        <p className="text-sm leading-relaxed text-white/60">
          &quot;{title}&quot; · {rupees(Number(price))} · {CONDITIONS.find((c) => c.value === condition)?.label} ·{" "}
          {address}. It will appear in the {kind === "book" ? "Books" : kind === "device" ? "Equipment" : "Homes"} feed
          within a few minutes{premium ? " with your Premium 7-day listing boost" : ""}.
        </p>
        {premium ? (
          <div className="rounded-xl border border-flare-400/25 bg-flare-500/8 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-flare-200">
              <span className="rounded-full border border-flare-400/30 px-2 py-0.5 text-[10px] uppercase">✓ Verified seller</span>
              Seller benefits active
            </p>
            <p className="mt-2 text-xs text-white/55">
              {demoSaleRecorded
                ? `Demo sale recorded. ${3 - feeFreeSalesUsed} of 3 fee-free completed sales remain this month.`
                : `${3 - feeFreeSalesUsed} of 3 fee-free completed sales remain this month.`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={demoSaleRecorded || feeFreeSalesUsed >= 3 || !hydrated}
                onClick={() => {
                  if (!recordFeeFreeSale()) return;
                  setDemoSaleRecorded(true);
                  pushToast({
                    title: "Demo sale recorded",
                    body: "No seller commission was charged for this simulated sale. No real transaction took place.",
                    tone: "premium",
                  });
                }}
                className="cl-btn cl-btn-flare disabled:opacity-50"
              >
                {demoSaleRecorded ? "Demo sale recorded" : feeFreeSalesUsed >= 3 ? "Monthly fee-free sales used" : "Simulate completed sale"}
              </button>
              <button
                type="button"
                disabled={supportRequested}
                onClick={() => {
                  setSupportRequested(true);
                  pushToast({
                    title: "Priority seller support requested",
                    body: "Demo mode — the request is not sent to a support team.",
                    tone: "premium",
                  });
                }}
                className="cl-btn cl-btn-ghost disabled:opacity-50"
              >
                {supportRequested ? "Support requested" : "Request priority support"}
              </button>
            </div>
            <p className="mt-2 text-[10px] text-white/40">
              Demo controls only. This preview does not create listings, sales, or real support tickets.
            </p>
          </div>
        ) : (
          <Link href="/premium" className="cl-btn cl-btn-flare self-start">
            Upgrade for a 7-day boost and seller benefits
          </Link>
        )}
        <button
          type="button"
          className="cl-btn cl-btn-ghost self-start"
          onClick={() => {
            setDone(false);
            setDemoSaleRecorded(false);
            setSupportRequested(false);
            setTitle("");
            setPrice("");
            setAddress("");
          }}
        >
          List another item
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="cl-panel cl-panel-solid flex flex-col gap-4 p-6">
      {premium ? (
        <div className="rounded-xl border border-flare-400/25 bg-flare-500/8 p-3 text-xs text-flare-100">
          <span className="inline-flex items-center gap-1.5"><span className="rounded-full border border-flare-400/30 px-1.5 py-0.5 text-[10px] uppercase">✓ Verified</span> Verified seller: this listing gets a 7-day boost. Your first 3 completed sales each month are fee-free.</span>
        </div>
      ) : null}
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            { value: "book", label: "Books", icon: <BookIcon width={15} height={15} /> },
            { value: "device", label: "2nd hand device", icon: <LaptopIcon width={15} height={15} /> },
            { value: "home", label: "Home / room", icon: <HomeIcon width={15} height={15} /> },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              setKind(opt.value);
              window.history.replaceState(null, "", `/sell?type=${opt.value}`);
              window.dispatchEvent(new Event("selltype"));
            }}
            className={cn("cl-btn justify-center", kind === opt.value ? "cl-btn-primary" : "cl-btn-ghost")}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] tracking-wider text-white/40 uppercase">Title</span>
        <input
          className="cl-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
              placeholder={kind === "book" ? "e.g. Cormen — Introduction to Algorithms" : kind === "device" ? "e.g. Dell Latitude 5420, 16GB RAM" : "e.g. 2 BHK for rent in Koramangala"}
          required
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] tracking-wider text-white/40 uppercase">Price (₹)</span>
          <input
            className="cl-input"
            type="number"
            min={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="450"
            required
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] tracking-wider text-white/40 uppercase">Condition</span>
          <select className="cl-input" value={condition} onChange={(e) => setCondition(e.target.value)}>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value} className="bg-ink-900">
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] tracking-wider text-white/40 uppercase">
          {kind === "book" ? "Book shop address" : kind === "device" ? "Device shop address" : "Home address / shop address"}
        </span>
        <input
          className="cl-input"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. Shop 12, Main Market, Block C, Hostel Gate"
          required
        />
      </label>
      <button type="submit" className="cl-btn cl-btn-primary justify-center">
        {kind === "book" ? "Sell my books" : kind === "device" ? "Sell my device" : "Sell / list my home"}
      </button>
      <p className="text-xs text-white/40">
        No listing fee. Standard sale commission applies{premium ? " after your first 3 fee-free sales this month" : ""}.
      </p>
      {!premium ? (
        <Link href="/premium" className="text-xs text-flare-200 hover:text-flare-100">
          Verified sellers get 3 fee-free sales each month, listing boosts, and priority support
        </Link>
      ) : null}
    </form>
  );
}
