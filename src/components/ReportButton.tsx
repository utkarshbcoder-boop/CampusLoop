"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { resendVerificationEmail } from "@/lib/firebase/auth";
import {
  REPORT_REASONS,
  hasReported,
  submitReport,
  type ReportReason,
  type ReportTargetType,
} from "@/lib/firebase/reports";

/**
 * Flag a listing, home, or review for admin moderation.
 *
 * Collapsed to a small ghost button; expands into an inline reason + details
 * form. One report per reporter per target (deterministic doc ID), and only
 * admins can ever read the queue (rules).
 */
export function ReportButton({
  targetType,
  targetId,
  targetTitle = "",
  compact = false,
}: {
  targetType: ReportTargetType;
  targetId: string;
  /** Optional target title — used in the confirmation message. */
  targetTitle?: string;
  /** Render as a text-sized control (used inside review rows). */
  compact?: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const uid = user?.uid;
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"neutral" | "success">("neutral");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);

  // Reset the cached pre-check whenever the viewer or target changes.
  useEffect(() => {
    setAlreadyReported(false);
  }, [uid, targetType, targetId]);

  // Pre-check (full variant only): if this user already reported the target,
  // skip the form and say so. The `active` guard keeps a stale response from
  // overwriting state after the form closes or the props change. Setting the
  // result unconditionally is a no-op re-render when it is already true, so
  // reopening after a submit doesn't flash the form.
  useEffect(() => {
    if (!open || compact || !uid) return;
    let active = true;
    hasReported(targetType, targetId, uid).then((reported) => {
      if (active) setAlreadyReported(reported);
    });
    return () => {
      active = false;
    };
  }, [open, compact, uid, targetType, targetId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    if (!user.emailVerified) {
      setTone("neutral");
      setMessage("Verify your email before reporting content — check your inbox for the link.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await submitReport({
        targetType,
        targetId,
        reporterId: user.uid,
        reason,
        details,
      });
      if (result === "created") {
        setTone("success");
        setMessage(
          targetTitle
            ? `Thanks for reporting “${targetTitle}”. Our team will review it shortly.`
            : "Report submitted. Our team will review it shortly.",
        );
        setAlreadyReported(true);
        setOpen(false);
        setDetails("");
      } else {
        setTone("neutral");
        setMessage("You have already reported this. Thanks for flagging it.");
        setAlreadyReported(true);
        setOpen(false);
      }
    } catch (error) {
      console.error("Failed to submit report:", error);
      setTone("neutral");
      setMessage("Could not submit the report. Please try again.");
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

  if (compact) {
    return (
      <span className="inline-flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="text-[11px] text-white/35 transition hover:text-rose-300"
        >
          Report
        </button>
        {open ? (
          <ReportForm
            reason={reason}
            setReason={setReason}
            details={details}
            setDetails={setDetails}
            busy={busy}
            onSubmit={submit}
            onCancel={() => setOpen(false)}
          />
        ) : null}
        {message ? (
          <span role="status" className={`text-[11px] ${tone === "success" ? "text-mint-300" : "text-white/55"}`}>
            {message}
          </span>
        ) : null}
        {user && !user.emailVerified && open ? (
          <button
            type="button"
            onClick={resendVerification}
            disabled={resending}
            className="text-left text-[11px] text-brand-300 transition hover:text-brand-200 disabled:opacity-50"
          >
            {resending ? "Sending…" : "Resend verification email"}
          </button>
        ) : null}
      </span>
    );
  }

  return (
    <div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-white/40 transition hover:text-rose-300"
        >
          ⚑ Report this listing
        </button>
      ) : alreadyReported ? (
        <p role="status" className="mt-1 text-xs text-white/55">
          You already reported this. Thanks for flagging it.
        </p>
      ) : (
        <ReportForm
          reason={reason}
          setReason={setReason}
          details={details}
          setDetails={setDetails}
          busy={busy}
          onSubmit={submit}
          onCancel={() => setOpen(false)}
        />
      )}
      {message ? (
        <p role="status" className={`mt-2 text-xs ${tone === "success" ? "text-mint-300" : "text-white/55"}`}>
          {message}
          {user && !user.emailVerified && !open ? (
            <button
              type="button"
              onClick={resendVerification}
              disabled={resending}
              className="ml-2 text-brand-300 transition hover:text-brand-200 disabled:opacity-50"
            >
              {resending ? "Sending…" : "Resend verification email"}
            </button>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

function ReportForm({
  reason,
  setReason,
  details,
  setDetails,
  busy,
  onSubmit,
  onCancel,
}: {
  reason: ReportReason;
  setReason: (value: ReportReason) => void;
  details: string;
  setDetails: (value: string) => void;
  busy: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const reasonId = useId();
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-3"
    >
      <label className="text-[11px] uppercase tracking-wide text-white/40" htmlFor={reasonId}>
        Reason
      </label>
      <select
        id={reasonId}
        value={reason}
        onChange={(event) => setReason(event.target.value as ReportReason)}
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none transition focus:border-brand-400/60"
      >
        {REPORT_REASONS.map((value) => (
          <option key={value} value={value} className="bg-ink-950 text-white">
            {value[0].toUpperCase() + value.slice(1)}
          </option>
        ))}
      </select>
      <textarea
        value={details}
        onChange={(event) => setDetails(event.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Add details (optional) — what's wrong with this listing?"
        className="resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 outline-none transition focus:border-brand-400/60"
      />
      <div className="flex items-center gap-2">
        <button type="submit" disabled={busy} className="cl-btn cl-btn-primary px-3 py-1.5 text-xs disabled:opacity-50">
          {busy ? "Sending…" : "Submit report"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="cl-btn cl-btn-ghost px-3 py-1.5 text-xs"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
