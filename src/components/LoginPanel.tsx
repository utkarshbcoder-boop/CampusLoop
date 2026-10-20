"use client";

import { useState } from "react";
import { requestPasswordReset, signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/firebase/auth";

function authErrorMessage(error: unknown, provider: "email" | "google"): string {
  const code = (error as { code?: string } | null)?.code;

  if (code === "auth/operation-not-allowed") {
    const method = provider === "email" ? "Email/Password" : "Google";
    return `${method} sign-in is disabled for this Firebase project. Enable it in Firebase Console → Authentication → Sign-in method.`;
  }
  if (code === "auth/email-already-in-use") {
    return "This email already has an account. Sign in — or use Continue with Google.";
  }
  if (code === "auth/user-not-found" || code === "auth/invalid-credential" || code === "auth/wrong-password") {
    return "Wrong email or password.";
  }
  if (code === "auth/weak-password") {
    return "Password should be at least 6 characters.";
  }

  return error instanceof Error ? error.message : "Sign-in failed. Try again.";
}

export function LoginPanel({ onGuest }: { onGuest?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resetBusy, setResetBusy] = useState(false);
  const [keepMe, setKeepMe] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");

  const markVisited = () => {
    try {
      if (keepMe) {
        localStorage.setItem("campusloop_keep", "1");
      } else {
        sessionStorage.setItem("campusloop_session", "1");
      }
    } catch {}
  };

  const submit = async () => {
    setError(null);
    setNotice(null);
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setError("Enter your name to sign up.");
          setBusy(false);
          return;
        }
        await signUpWithEmail(name, email, password, keepMe);
      } else {
        await signInWithEmail(email, password, keepMe);
      }
      markVisited();
    } catch (e) {
      setError(authErrorMessage(e, "email"));
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }

    setResetBusy(true);
    try {
      await requestPasswordReset(email.trim());
      setNotice("If an account exists for that email, Firebase will send a password reset link.");
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      setError(
        code === "auth/invalid-email"
          ? "Enter a valid email address."
          : authErrorMessage(e, "email"),
      );
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <div className="cl-panel cl-panel-solid w-full max-w-md p-8">
      <h1 className="text-center text-2xl font-black tracking-tight text-white">
        {mode === "signup" ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1.5 text-center text-sm text-white/50">
        {mode === "signup" ? "Sign up for CampusLoop" : "Sign in to your CampusLoop account"}
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {mode === "signup" && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            autoComplete="name"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-brand-400/60"
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          autoComplete="email"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-brand-400/60"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-brand-400/60"
        />
        {mode === "signin" && (
          <button
            type="button"
            onClick={resetPassword}
            disabled={busy || resetBusy}
            className="self-end text-xs text-brand-300 transition hover:text-brand-200 disabled:opacity-50"
          >
            {resetBusy ? "Sending reset link…" : "Forgot password?"}
          </button>
        )}
        <label className="mt-1 flex items-center gap-2 text-xs text-white/55 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={keepMe}
            onChange={(e) => setKeepMe(e.target.checked)}
            className="h-3.5 w-3.5 accent-brand-500"
          />
          Keep me logged in
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={submit}
          className="cl-btn cl-btn-primary mt-1 px-4 py-3 text-sm"
        >
          {busy ? (mode === "signup" ? "Creating account…" : "Signing in…") : mode === "signup" ? "Create account" : "Sign in"}
        </button>
        <button
          type="button"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
          className="text-center text-xs text-brand-300 transition hover:text-brand-200"
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
        {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
        {notice && <p role="status" className="text-xs text-mint-300">{notice}</p>}
      </div>

      <div className="my-5 flex items-center gap-3 text-[11px] text-white/30 uppercase">
        <span className="h-px flex-1 bg-white/8" /> or <span className="h-px flex-1 bg-white/8" />
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await signInWithGoogle(keepMe);
            markVisited();
          } catch (e) {
            const code = (e as { code?: string }).code;
            if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
              setError(null);
            } else {
              setError(authErrorMessage(e, "google"));
              console.error(e);
            }
          } finally {
            setBusy(false);
          }
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      {onGuest && (
        <button
          type="button"
          onClick={onGuest}
          className="mt-4 w-full text-center text-xs text-white/40 underline-offset-4 transition hover:text-white/70 hover:underline"
        >
          Continue as guest
        </button>
      )}
    </div>
  );
}
