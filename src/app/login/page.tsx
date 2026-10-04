"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { signInWithGoogle } from "@/lib/firebase/auth";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      try {
        localStorage.setItem("campusloop_visited", "1");
      } catch {}
      router.replace("/");
    }
  }, [user, loading, router]);

  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-16">
      <div className="cl-grid-bg pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(99,102,241,0.35), transparent)" }}
        aria-hidden
      />
      <div className="cl-panel cl-panel-solid relative w-full max-w-md p-8 text-center">
        <h1 className="text-2xl font-black tracking-tight text-white">Welcome to CampusLoop</h1>
        <p className="mt-2 text-sm text-white/55">
          Sign in with your college Google account to continue.
        </p>
        <button
          type="button"
          disabled={signingIn || loading}
          onClick={async () => {
            setSigningIn(true);
            setError(null);
            try {
              await signInWithGoogle();
            } catch (e) {
              setError("Sign-in failed. Please try again.");
              console.error(e);
            } finally {
              setSigningIn(false);
            }
          }}
          className="cl-btn cl-btn-primary mx-auto mt-6 flex items-center justify-center gap-2 px-5 py-3 text-sm"
        >
          {signingIn ? "Signing in…" : "Sign in with Google"}
        </button>
        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem("campusloop_visited", "1");
            } catch {}
            router.replace("/");
          }}
          className="mt-4 text-xs text-white/40 underline-offset-4 transition hover:text-white/70 hover:underline"
        >
          Continue as guest
        </button>
      </div>
    </section>
  );
}
