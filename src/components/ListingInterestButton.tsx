"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { recordListingInterest } from "@/lib/firebase/marketplace";

export function ListingInterestButton({
  listingId,
  status,
}: {
  listingId: string;
  status: string;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function registerInterest() {
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await recordListingInterest(listingId, user.uid);
      setMessage(
        result === "created"
          ? "Your interest was shared with the seller."
          : result === "exists"
            ? "You have already registered interest."
            : result === "own"
              ? "This is your own listing."
              : "This item is no longer available.",
      );
    } catch (error) {
      console.error("Failed to register listing interest:", error);
      setMessage("Could not register your interest. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={registerInterest}
        disabled={busy || status !== "available"}
        className="cl-btn cl-btn-primary disabled:opacity-50"
      >
        {busy ? "Sending…" : status === "available" ? "I'm interested" : "Not available"}
      </button>
      {message ? <p role="status" className="mt-2 text-xs text-white/55">{message}</p> : null}
    </div>
  );
}
