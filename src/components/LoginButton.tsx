"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { signInWithGoogle, signOutUser } from "@/lib/firebase/auth";

export function LoginButton() {
  const { user, loading, isAdmin } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  if (loading) {
    return (
      <div className="h-9 w-24 animate-pulse rounded-lg bg-white/8" />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {isAdmin && (
          <Link
            href="/admin"
            className="cl-btn cl-btn-flare px-3 py-1.5 text-xs"
          >
            🛡️ Admin
          </Link>
        )}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label="Account menu"
            aria-expanded={menuOpen}
            aria-controls="account-menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:border-white/20 hover:bg-white/8"
          >
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt=""
                width={24}
                height={24}
                unoptimized
                className="h-6 w-6 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/30 text-[10px] font-bold text-brand-200">
                {user.displayName?.[0] ?? user.email?.[0] ?? "?"}
              </span>
            )}
            <span className="hidden sm:inline">{user.displayName?.split(" ")[0] ?? "User"}</span>
          </button>
          <div
            id="account-menu"
            hidden={!menuOpen}
            className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-white/10 bg-ink-850 p-2 shadow-2xl"
          >
            <p className="px-2 py-1 text-[11px] text-white/45">
              {user.email}
            </p>
            {isAdmin && (
              <p className="px-2 py-0.5 text-[10px] font-semibold text-flare-400">
                ⭐ Admin
              </p>
            )}
            <div className="my-1 h-px bg-white/8" />
            <Link
              href="/my-listings"
              onClick={() => setMenuOpen(false)}
              className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-white/70 transition hover:bg-white/8 hover:text-white"
            >
              My Listings
            </Link>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                void signOutUser();
              }}
              className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-white/70 transition hover:bg-white/8 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={async () => {
        setSigningIn(true);
        try {
          await signInWithGoogle();
        } catch (err) {
          console.error("Sign-in failed:", err);
        } finally {
          setSigningIn(false);
        }
      }}
      disabled={signingIn}
      className="cl-btn cl-btn-primary px-4 py-2 text-xs"
    >
      {signingIn ? (
        <>
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Signing in…
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </>
      )}
    </button>
  );
}
