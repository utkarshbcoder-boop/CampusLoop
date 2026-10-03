"use client";

import { useState } from "react";
import { BookIcon, LaptopIcon } from "@/components/Icon";
import { rupees } from "@/lib/format";
import { useCampusLoop } from "@/lib/store";
import { cn } from "@/lib/utils";

const CONDITIONS = [
  { value: "like_new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "heavy_notes", label: "Heavy notes / well used" },
];

export function SellForm({ initialKind }: { initialKind: "book" | "device" }) {
  const { pushToast } = useCampusLoop();
  const [kind, setKind] = useState<"book" | "device">(initialKind);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("good");
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price) return;
    setDone(true);
    pushToast({
      title: kind === "book" ? "Book listed" : "Device listed",
      body: `"${title.trim()}" for ${rupees(Number(price))} is now live on CampusLoop. Students on your campus can buy it with escrow-backed handover. Demo mode — no real listing was created.`,
      tone: "success",
    });
  };

  if (done) {
    return (
      <div className="cl-panel cl-panel-solid flex flex-col gap-3 p-6">
        <p className="text-base font-semibold text-mint-400">Your listing is live</p>
        <p className="text-sm leading-relaxed text-white/60">
          &quot;{title}&quot; · {rupees(Number(price))} · {CONDITIONS.find((c) => c.value === condition)?.label}. It will
          appear in the {kind === "book" ? "Books" : "Equipment"} feed within a few minutes.
        </p>
        <button
          type="button"
          className="cl-btn cl-btn-ghost self-start"
          onClick={() => {
            setDone(false);
            setTitle("");
            setPrice("");
          }}
        >
          List another item
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="cl-panel cl-panel-solid flex flex-col gap-4 p-6">
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { value: "book", label: "Books", icon: <BookIcon width={15} height={15} /> },
            { value: "device", label: "2nd hand device", icon: <LaptopIcon width={15} height={15} /> },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setKind(opt.value)}
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
          placeholder={kind === "book" ? "e.g. Cormen — Introduction to Algorithms" : "e.g. Dell Latitude 5420, 16GB RAM"}
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
      <button type="submit" className="cl-btn cl-btn-primary justify-center">
        {kind === "book" ? "Sell my books" : "Sell my device"}
      </button>
      <p className="text-xs text-white/40">CampusLoop takes no listing fee — we earn a small commission only when it sells.</p>
    </form>
  );
}
