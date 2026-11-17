"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { resendVerificationEmail } from "@/lib/firebase/auth";
import {
  getOrCreateConversation,
  type ConversationTargetType,
} from "@/lib/firebase/messaging";

/**
 * "Message seller" on a listing / home detail page.
 *
 * Creates (or reuses) the deterministic buyer conversation and opens the
 * thread at /messages/[conversationId]. Sample listings have no real seller,
 * so the button is hidden for them.
 */
export function MessageSellerButton({
  targetType,
  targetId,
  targetTitle,
  status = "available",
  sample = false,
}: {
  targetType: ConversationTargetType;
  targetId: string;
  targetTitle: string;
  /** Listing/home status — conversations only open while available. */
  status?: string;
  /** Sample fixtures have no real seller; hide the button. */
  sample?: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  if (sample) return null;

  async function startConversation() {
    if (!user) {
      router.push(`/login?returnTo=${encodeURIComponent(`/messages`)}`);
      return;
    }
    if (!user.emailVerified) {
      setMessage("Verify your email to message sellers — check your inbox for the verification link.");
      return;
    }
    if (status !== "available") {
      setMessage("This listing is no longer available.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await getOrCreateConversation({
        targetType,
        targetId,
        targetTitle,
        buyerId: user.uid,
      });
      if ("conversationId" in result) {
        router.push(`/messages/${result.conversationId}`);
        return;
      }
      setMessage(
        result.status === "own"
          ? "This is your own listing."
          : "This listing is no longer available.",
      );
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setMessage("Could not start a conversation. Please try again.");
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
        onClick={startConversation}
        disabled={busy || status !== "available"}
        className="cl-btn cl-btn-ghost w-full justify-center disabled:opacity-50"
      >
        {busy ? "Opening…" : "💬 Message seller"}
      </button>
      {user && !user.emailVerified ? (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/55">
          <p>Verify your email to message sellers.</p>
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
