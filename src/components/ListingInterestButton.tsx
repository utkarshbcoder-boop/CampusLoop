"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { resendVerificationEmail } from "@/lib/firebase/auth";
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
  const [resending, setResending] = useState(false);

  async function registerInterest() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!user.emailVerified) {
      setMessage("Verify your email to register interest — check your inbox for the verification link.");
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

  async function resendVerification() {
    setResending(true);
    setMessage("");
    try {
      await resendVerificationEmail();
      setMessage("Verification email resent — check your inbox for the link.");
    } catch (error) {
      console.error("Failed to resend verification email:", error);
      setMessage("Could not resend the verification email. Please try again.");
    } finally {
      setResending(false);
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
      {user && !user.emailVerified ? (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/55">
          <p>Verify your email to register interest in listings.</p>
          <button
            type="button"
            onClick={resendVerification}
            disabled={resending}
            className="text-brand-300 transition hover:text-brand-200 disabled:opacity-50"
          >
            {resending ? "Sending…" : "Resend verification email"}
          </button>
        </div>
      ) : null}
      {message ? <p role="status" className="mt-2 text-xs text-white/55">{message}</p> : null}
    </div>
  );
}
