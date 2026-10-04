"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { deleteCurrentAccount, signOutUser } from "@/lib/firebase/auth";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-sm text-white/50">Loading…</div>;
  }

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight text-white">Settings</h1>

      <div className="cl-panel cl-panel-solid mt-8 p-6">
        <h2 className="text-sm font-semibold text-white">Appearance</h2>
        <p className="mt-1 text-xs text-white/50">Switch between dark and light mode.</p>
        <div className="mt-4">
          <ThemeToggle />
        </div>
      </div>

      <div className="cl-panel cl-panel-solid mt-6 p-6">
        <h2 className="text-sm font-semibold text-white">Account</h2>
        {user ? (
          <p className="mt-1 text-xs text-white/50">Signed in as {user.email}</p>
        ) : (
          <p className="mt-1 text-xs text-white/50">You are not signed in.</p>
        )}

        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            disabled={!user || busy !== null}
            onClick={async () => {
              setBusy("deactivate");
              setError(null);
              try {
                await signOutUser();
                router.push("/");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to deactivate.");
              } finally {
                setBusy(null);
              }
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/80 transition hover:bg-white/10 disabled:opacity-40"
          >
            {busy === "deactivate" ? "Deactivating…" : "Deactivate account (sign out; sign back in anytime to reactivate)"}
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
              } catch (e) {
                const code = (e as { code?: string }).code;
                setError(
                  code === "auth/requires-recent-login"
                    ? "For security, sign out, sign back in, and try deleting again."
                    : e instanceof Error
                      ? e.message
                      : "Failed to delete account.",
                );
              } finally {
                setBusy(null);
              }
            }}
            className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-left text-sm text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-40"
          >
            {busy === "delete" ? "Deleting…" : "Delete account permanently"}
          </button>
        </div>
        {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
      </div>
    </section>
  );
}
