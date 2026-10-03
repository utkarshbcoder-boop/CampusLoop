"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, HeartIcon, RepeatIcon, SparkIcon, StarIcon } from "@/components/Icon";
import { rupees } from "@/lib/format";
import { useCampusLoop } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Interactive demo actions.
 *
 * These make the MVP feel like a working product without pretending to be a
 * payment gateway: every action updates the UI, persists locally, and reports
 * honestly that the underlying store is in-memory in the seeded data layer.
 */

function useDemoAction(kind: string, id: string) {
  const { hasAction, setAction, pushToast } = useCampusLoop();
  return {
    done: hasAction(kind, id),
    record: (value: string, title: string, body: string, tone: "success" | "info" | "premium" = "success") => {
      setAction(kind, id, value);
      pushToast({ title, body, tone });
    },
    notify: pushToast,
  };
}

export function SaveButton({
  id,
  label = "Save",
  className,
}: {
  id: string;
  label?: string;
  className?: string;
}) {
  const { isSaved, toggleSave, pushToast } = useCampusLoop();
  const saved = isSaved(id);
  return (
    <button
      type="button"
      onClick={() => {
        toggleSave(id);
        pushToast({
          title: saved ? "Removed from saved" : "Saved to your list",
          body: saved ? "You can find it again any time from your profile." : "We will tell you if the price drops.",
          tone: "info",
        });
      }}
      className={cn("cl-btn cl-btn-ghost", saved && "border-rose-400/50 text-rose-200", className)}
      aria-pressed={saved}
    >
      <HeartIcon width={15} height={15} />
      {saved ? "Saved" : label}
    </button>
  );
}

export function ContactButton({
  sellerName,
  itemTitle,
  premiumUpsell,
}: {
  sellerName: string;
  itemTitle: string;
  premiumUpsell?: boolean;
}) {
  const { record, done } = useDemoAction("contact", `${sellerName}-${itemTitle}`);
  const { premium } = useCampusLoop();
  return (
    <button
      type="button"
      disabled={done}
      onClick={() =>
        record(
          "contacted",
          "Request sent",
          `${sellerName} usually replies within ${premium ? "an hour" : "three hours"}. Demo mode — no real message is sent.`,
          "success",
        )
      }
      className={cn("cl-btn cl-btn-primary", done && "opacity-70")}
    >
      {done ? <CheckIcon width={16} height={16} /> : null}
      {done ? "Request sent" : `Message ${sellerName.split(" ")[0]}`}
      {!done && premiumUpsell && !premium ? <span className="text-[10px] opacity-80">★ faster</span> : null}
    </button>
  );
}

export function BookServiceButton({
  serviceId,
  serviceName,
  price,
  premiumOnly,
  defaultPrice,
}: {
  serviceId: string;
  serviceName: string;
  price: number;
  premiumOnly: boolean;
  defaultPrice?: number;
}) {
  const { record, done } = useDemoAction("booking", serviceId);
  const { premium } = useCampusLoop();
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState("weekday_afternoon");
  const [address, setAddress] = useState("");
  const [issue, setIssue] = useState("");

  const blocked = premiumOnly && !premium;
  const finalPrice = defaultPrice ?? price;

  if (done) {
    return (
      <div className="cl-panel cl-panel-solid flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-mint-400">
          <CheckIcon width={16} height={16} /> Slot booked
        </div>
        <p className="text-xs leading-relaxed text-white/55">
          {serviceName} · {slot.replace("_", " ")} · {rupees(finalPrice)}. The provider has been notified and will
          confirm by SMS. Tracking lives in My Bookings.
        </p>
        <button type="button" onClick={() => setOpen(false)} className="cl-btn cl-btn-ghost self-start">
          Close
        </button>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="cl-panel flex flex-col gap-2 border-flare-400/30 bg-flare-500/8 p-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-flare-300">
          <StarIcon width={14} height={14} /> Premium booking required
        </p>
        <p className="text-xs leading-relaxed text-white/60">
          {serviceName} is reserved for Premium members because response times on this service are the tightest in the
          catalogue. Premium also unlocks priority slots and same-day booking.
        </p>
        <a href="/premium" className="cl-btn cl-btn-flare self-start">
          See Premium benefits
        </a>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="cl-btn cl-btn-primary">
        Book a slot · {rupees(finalPrice)}
        {premium ? <span className="text-[10px] opacity-80">★ priority</span> : null}
      </button>
    );
  }

  return (
    <div className="cl-panel cl-panel-solid flex flex-col gap-3 p-4">
      <p className="text-sm font-semibold text-white">Book {serviceName}</p>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] tracking-wider text-white/40 uppercase">Slot</span>
        <select className="cl-input" value={slot} onChange={(e) => setSlot(e.target.value)}>
          <option value="weekday_morning" className="bg-ink-900">Weekday morning</option>
          <option value="weekday_afternoon" className="bg-ink-900">Weekday afternoon</option>
          <option value="weekday_evening" className="bg-ink-900">Weekday evening</option>
          <option value="weekday_night" className="bg-ink-900">Weekday late night</option>
          <option value="weekend_morning" className="bg-ink-900">Weekend morning</option>
          <option value="weekend_afternoon" className="bg-ink-900">Weekend afternoon</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] tracking-wider text-white/40 uppercase">Address</span>
        <input
          className="cl-input"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Hostel Block A, Room 314"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] tracking-wider text-white/40 uppercase">What is going on?</span>
        <textarea
          className="cl-input min-h-20 resize-y"
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
          placeholder="Tube light flickering since last night, started after the storm."
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            record(
              "booked",
              "Slot confirmed",
              `${serviceName} · ${slot.replace("_", " ")} · ${rupees(finalPrice)}${premium ? " (priority)" : ""}. Demo mode — the seeded data layer records this in memory.`,
              "success",
            );
            setOpen(false);
          }}
          className="cl-btn cl-btn-primary"
        >
          Confirm booking
        </button>
        <button type="button" onClick={() => setOpen(false)} className="cl-btn cl-btn-ghost">
          Cancel
        </button>
        <span className="ml-auto text-xs text-white/40">Pay after service</span>
      </div>
    </div>
  );
}

export function RsvpButton({ eventId, eventTitle, price, free }: {
  eventId: string;
  eventTitle: string;
  price: number;
  free: boolean;
}) {
  const { record, done } = useDemoAction("rsvp", eventId);
  return (
    <button
      type="button"
      disabled={done}
      onClick={() =>
        record(
          "rsvp",
          "You're on the list",
          `${eventTitle} — ${free ? "Free entry" : `${rupees(price)} per head`}. Calendar invite is on its way.`,
          "success",
        )
      }
      className={cn("cl-btn cl-btn-primary", done && "bg-mint-500 opacity-90")}
    >
      {done ? <CheckIcon width={16} height={16} /> : null}
      {done ? "Registered" : free ? "RSVP free" : `Register · ${rupees(price)}`}
    </button>
  );
}

export function ApplyButton({ postId, postTitle, role }: { postId: string; postTitle: string; role: string }) {
  const { record, done } = useDemoAction("apply", postId);
  return (
    <button
      type="button"
      disabled={done}
      onClick={() =>
        record(
          "applied",
          "Application sent",
          `You applied for ${role} on "${postTitle}". The post owner gets your profile and skill breakdown.`,
          "success",
        )
      }
      className={cn("cl-btn cl-btn-primary", done && "bg-mint-500 opacity-90")}
    >
      {done ? <CheckIcon width={16} height={16} /> : null}
      {done ? "Applied" : `Apply for ${role}`}
    </button>
  );
}

export function RentButton({ itemId, itemName, dayRate }: { itemId: string; itemName: string; dayRate: number }) {
  const { record, done } = useDemoAction("rent", itemId);
  return (
    <button
      type="button"
      disabled={done}
      onClick={() =>
        record(
          "reserved",
          "Reservation held",
          `${itemName} held for 24 hours at ${rupees(dayRate)}/day. Pay on pickup; deposit is refunded after return.`,
          "success",
        )
      }
      className={cn("cl-btn cl-btn-primary", done && "bg-mint-500 opacity-90")}
    >
      <RepeatIcon width={15} height={15} />
      {done ? "Held for 24h" : "Reserve for a day"}
    </button>
  );
}

export function BuyButton({ listingId, title, price }: { listingId: string; title: string; price: number }) {
  const { record, done } = useDemoAction("buy", listingId);
  return (
    <button
      type="button"
      disabled={done}
      onClick={() =>
        record(
          "buying",
          "Seller notified",
          `Your interest in "${title}" was sent. CampusLoop holds ₹${price} in escrow until you confirm the handover — no cash exchange on campus.`,
          "success",
        )
      }
      className={cn("cl-btn cl-btn-primary", done && "bg-mint-500 opacity-90")}
    >
      {done ? <CheckIcon width={16} height={16} /> : null}
      {done ? "Reserved for you" : `Buy for ${rupees(price)}`}
    </button>
  );
}

export function SkillExchangeButton({ skillId, title, creditRate }: { skillId: string; title: string; creditRate: number }) {
  const { record, done } = useDemoAction("skill", skillId);
  return (
    <button
      type="button"
      disabled={done}
      onClick={() =>
        record(
          "requested",
          "Exchange requested",
          `"${title}" — ${creditRate} credit(s) per session. Your credits are only deducted once both sides confirm the session happened.`,
          "success",
        )
      }
      className={cn("cl-btn cl-btn-primary", done && "bg-mint-500 opacity-90")}
    >
      {done ? <CheckIcon width={16} height={16} /> : null}
      {done ? "Requested" : "Request session"}
    </button>
  );
}

export function PremiumToggleButton() {
  const { premium, setPremium, pushToast } = useCampusLoop();
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        setPremium(!premium);
        pushToast({
          title: premium ? "Premium switched off" : "Premium switched on",
          body: premium
            ? "Back to free limits: 3 roommate matches a day, standard booking slots."
            : "Unlimited roommate matches, boosted listings, priority booking and full score breakdowns are now active.",
          tone: premium ? "info" : "premium",
        });
        router.refresh();
      }}
      className={cn("cl-btn", premium ? "cl-btn-flare" : "cl-btn-primary")}
    >
      <SparkIcon width={15} height={15} />
      {premium ? "Premium is active" : "Activate Premium demo"}
    </button>
  );
}
