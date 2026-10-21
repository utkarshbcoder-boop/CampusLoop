"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SettingsPreferences } from "@/components/SettingsPreferences";
import { colleges } from "@/lib/data/colleges";
import { db } from "@/lib/firebase/config";
import { deleteCurrentAccount, requestPasswordReset, signOutUser } from "@/lib/firebase/auth";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [collegeId, setCollegeId] = useState("");

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName ?? "");
    let cancelled = false;
    void getDoc(doc(db, "profiles", user.uid)).then((snapshot) => {
      if (!cancelled && snapshot.exists()) {
        const profile = snapshot.data();
        setDisplayName((current) => current || String(profile.name ?? ""));
        setCollegeId(String(profile.college_id ?? ""));
      }
    }).catch((cause: unknown) => {
      console.error("Failed to load settings profile:", cause);
      if (!cancelled) setError("Could not load your profile settings.");
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const name = displayName.trim();
    if (!name) {
      setError("Enter a display name.");
      return;
    }
    setBusy("profile");
    setError(null);
    setNotice(null);
    try {
      await setDoc(doc(db, "profiles", user.uid), {
        id: user.uid,
        name,
        college_id: collegeId,
      }, { merge: true });
      const { updateProfile } = await import("firebase/auth");
      await updateProfile(user, { displayName: name });
      setNotice("Your profile settings have been saved.");
    } catch (cause) {
      console.error("Failed to save settings profile:", cause);
      setError("Could not save your profile. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-white/50">Loading settings…</div>;
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">Your CampusLoop</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Settings</h1>
        <p className="mt-2 text-sm text-white/50">Manage your profile, appearance, listings, and account security.</p>
      </div>

      {error ? <p role="alert" className="mb-4 rounded-xl border border-rose-400/25 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p> : null}
      {notice ? <p role="status" className="mb-4 rounded-xl border border-mint-400/25 bg-mint-500/10 p-3 text-sm text-mint-300">{notice}</p> : null}

      <div className="cl-panel cl-panel-solid p-6">
        <h2 className="text-base font-bold text-white">Profile</h2>
        {user ? (
          <>
            <p className="mt-1 text-sm text-white/50">These details help students recognize your listings.</p>
            <form onSubmit={saveProfile} className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-white/50">Display name</span>
                <input className="cl-input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} required />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-white/50">Campus</span>
                <select className="cl-input" value={collegeId} onChange={(event) => setCollegeId(event.target.value)}>
                  <option value="">Choose your campus</option>
                  {colleges.map((college) => <option key={college.id} value={college.id} className="bg-ink-900">{college.name}</option>)}
                </select>
              </label>
              <p className="text-xs text-white/40 sm:col-span-2">Account email: {user.email || "Not provided"}</p>
              <button type="submit" disabled={busy !== null} className="cl-btn cl-btn-primary justify-center sm:col-span-2 sm:justify-self-start">
                {busy === "profile" ? "Saving…" : "Save profile"}
              </button>
            </form>
          </>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-white/50">Sign in to personalize your profile.</p>
            <Link href="/login" className="cl-btn cl-btn-primary mt-4">Sign in</Link>
          </div>
        )}
      </div>

      <div className="cl-panel cl-panel-solid mt-5 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-base font-bold text-white">Appearance</h2>
          <p className="mt-1 text-sm text-white/50">Choose the theme that is easiest to read.</p>
        </div>
        <ThemeToggle />
      </div>

      <div className="cl-panel cl-panel-solid mt-5 p-6">
        <h2 className="text-base font-bold text-white">Your marketplace</h2>
        <p className="mt-1 text-sm text-white/50">Quick access to listings, saved items, and second-hand products.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link href="/my-listings" className="rounded-xl border border-white/10 bg-white/4 p-4 transition hover:border-brand-300/30 hover:bg-brand-500/8">
            <span className="text-lg" aria-hidden>📋</span>
            <span className="mt-2 block text-sm font-semibold text-white">My Listings</span>
            <span className="mt-1 block text-xs text-white/45">Track buyer interest and status</span>
          </Link>
          <Link href="/marketplace" className="rounded-xl border border-white/10 bg-white/4 p-4 transition hover:border-brand-300/30 hover:bg-brand-500/8">
            <span className="text-lg" aria-hidden>🛍️</span>
            <span className="mt-2 block text-sm font-semibold text-white">Second-hand market</span>
            <span className="mt-1 block text-xs text-white/45">Browse books and devices</span>
          </Link>
          <Link href="/saved" className="rounded-xl border border-white/10 bg-white/4 p-4 transition hover:border-brand-300/30 hover:bg-brand-500/8">
            <span className="text-lg" aria-hidden>⭐</span>
            <span className="mt-2 block text-sm font-semibold text-white">Saved items</span>
            <span className="mt-1 block text-xs text-white/45">Return to items you starred</span>
          </Link>
        </div>
      </div>

      <SettingsPreferences userId={user?.uid ?? "guest"} />

      <div className="cl-panel cl-panel-solid mt-5 p-6">
        <h2 className="text-base font-bold text-white">Security & account</h2>
        {user ? (
          <p className="mt-1 text-sm text-white/50">Signed in as {user.email || user.displayName || "CampusLoop user"}</p>
        ) : (
          <p className="mt-1 text-sm text-white/50">Sign in to manage account security.</p>
        )}
        <div className="mt-5 flex flex-col gap-3">
          {user?.email && user.providerData.some((provider) => provider.providerId === "password") ? (
            <button
              type="button"
              disabled={busy !== null}
              onClick={async () => {
                setBusy("password");
                setError(null);
                setNotice(null);
                try {
                  await requestPasswordReset(user.email!);
                  setNotice(`Password reset instructions were sent to ${user.email}.`);
                } catch (cause) {
                  console.error("Failed to request password reset:", cause);
                  setError("Could not send password reset email. Try again later.");
                } finally {
                  setBusy(null);
                }
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/80 transition hover:bg-white/10 disabled:opacity-40"
            >
              {busy === "password" ? "Sending reset email…" : "Change password"}
            </button>
          ) : null}
          <button
            type="button"
            disabled={!user || busy !== null}
            onClick={async () => {
              setBusy("signout");
              setError(null);
              try {
                await signOutUser();
                router.push("/");
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Failed to sign out.");
              } finally {
                setBusy(null);
              }
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/80 transition hover:bg-white/10 disabled:opacity-40"
          >
            {busy === "signout" ? "Signing out…" : "Sign out"}
          </button>
          <button
            type="button"
            disabled={!user || busy !== null}
            onClick={async () => {
              if (!window.confirm("Permanently delete your account? This cannot be undone.")) return;
              setBusy("delete");
              setError(null);
              try {
                await deleteCurrentAccount();
                router.push("/");
              } catch (cause) {
                const code = (cause as { code?: string }).code;
                setError(
                  code === "auth/requires-recent-login"
                    ? "For security, sign out, sign back in, and try deleting again."
                    : cause instanceof Error
                      ? cause.message
                      : "Failed to delete account.",
                );
              } finally {
                setBusy(null);
              }
            }}
            className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-left text-sm text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-40"
          >
            {busy === "delete" ? "Deleting account…" : "Delete account permanently"}
          </button>
        </div>
      </div>
    </section>
  );
}
