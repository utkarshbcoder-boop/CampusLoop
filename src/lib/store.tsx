"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/AuthProvider";

/**
 * Client-side demo state.
 *
 * Deliberately separate from the server data layer: this is the layer that
 * makes the UI *feel* real (saves, toasts, Premium toggle, optimistic
 * bookings) without pretending to be a database. It is persisted to
 * localStorage so a page refresh does not lose the demo's state.
 */

export interface Toast {
  id: string;
  title: string;
  body: string;
  tone: "success" | "info" | "premium" | "error";
}

interface CampusLoopState {
  saved: string[];
  hydrated: boolean;
  toggleSave: (id: string) => void;
  isSaved: (id: string) => boolean;
  premium: boolean;
  setPremium: (value: boolean) => void;
  feeFreeSalesUsed: number;
  recordFeeFreeSale: () => boolean;
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
  /** Optimistic record of actions taken in the UI, keyed by `${kind}:${id}`. */
  actions: Record<string, string>;
  setAction: (kind: string, id: string, value: string) => void;
  hasAction: (kind: string, id: string) => boolean;
}

const Context = createContext<CampusLoopState | null>(null);

const SAVED_KEY = "campusloop:saved";

/**
 * Account-synced wishlist (feature 6). Inlined at build time; when it is not
 * `"true"` we never even import the Firestore helpers, so local/sample mode
 * stays plain localStorage (guest saves work with no Firebase and no sign-in).
 */
const FIREBASE_SYNC = process.env.NEXT_PUBLIC_USE_FIREBASE === "true";

/** Signed-in users persist under their own key; guests keep the legacy key. */
function savedKeyForUser(uid: string): string {
  return `${SAVED_KEY}:${uid}`;
}

/** Deterministic union: keeps `base`'s order, appends missing `extra` in order. */
function unionSaves(base: string[], extra: string[]): string[] {
  const seen = new Set(base);
  const merged = [...base];
  for (const id of extra) {
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(id);
    }
  }
  return merged;
}

const PREMIUM_KEY = "campusloop:premium";
const ACTIONS_KEY = "campusloop:actions";
const FEE_FREE_SALES_KEY = "campusloop:fee-free-sales";

interface MonthlySalesUsage {
  month: string;
  used: number;
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function CampusLoopProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [saved, setSaved] = useState<string[]>([]);
  const [premium, setPremiumState] = useState(false);
  const [feeFreeSalesUsed, setFeeFreeSalesUsed] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [actions, setActions] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);
  const toastTimers = useRef<Map<string, number>>(new Map());

  // Authoritative mirror of `saved` for async work (cloud sync / watcher)
  // that must not read a stale closure.
  const savedRef = useRef(saved);
  savedRef.current = saved;
  // Which account's localStorage bucket the current `saved` belongs to.
  // `null` = the shared guest/legacy bucket. Deliberately NOT reset on
  // sign-out: later guest toggles keep writing to the last account's key so
  // they can never leak into the shared legacy key (and from there into a
  // different account on its first sign-in).
  const savesOwnerRef = useRef<string | null>(null);
  // Set once per uid so the cloud pull/migrate runs exactly once per sign-in;
  // reset on sign-out so a re-sign-in re-pulls.
  const syncedForUidRef = useRef<string | null>(null);
  const stopSavesWatchRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const timers = toastTimers.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  useEffect(() => {
    setSaved(readJson<string[]>(SAVED_KEY, []));
    setPremiumState(readJson<boolean>(PREMIUM_KEY, false));
    setActions(readJson<Record<string, string>>(ACTIONS_KEY, {}));
    const salesUsage = readJson<MonthlySalesUsage | null>(FEE_FREE_SALES_KEY, null);
    setFeeFreeSalesUsed(salesUsage?.month === currentMonthKey() ? salesUsage.used : 0);
    setHydrated(true);
  }, []);

  const persist = useCallback((key: string, value: unknown) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Private mode or quota exceeded — the demo still works, it just forgets.
    }
  }, []);

  /** Single write path for `saved`: mirror → state → localStorage (never a setState updater side effect). */
  const updateSaves = useCallback(
    (next: string[], key: string) => {
      savedRef.current = next;
      setSaved(next);
      persist(key, next);
    },
    [persist],
  );

  /** Where a save made right now should be persisted. */
  const savesPersistKey = useCallback((activeUid: string | null): string => {
    if (activeUid) return savedKeyForUser(activeUid);
    const owner = savesOwnerRef.current;
    return owner ? savedKeyForUser(owner) : SAVED_KEY;
  }, []);

  const pushToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
      const timer = window.setTimeout(() => {
        toastTimers.current.delete(id);
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5200);
      toastTimers.current.set(id, timer);
    },
    [],
  );

  /**
   * Account-synced wishlist: merge localStorage + Firestore into the single
   * `saved` list (the union is THE source of truth for rendering). Runs once
   * per uid, only after hydration, and never throws into render.
   */
  useEffect(() => {
    if (!hydrated) return;

    if (uid === null) {
      // Sign-out: keep `saved` exactly as-is (it is already persisted under
      // the account's key — no data loss) and keep the owner ref pointing at
      // the last account. Only the "already synced" marker resets, so a
      // re-sign-in re-pulls cloud state.
      syncedForUidRef.current = null;
      return;
    }

    if (syncedForUidRef.current === uid) return;

    const userKey = savedKeyForUser(uid);
    const owner = savesOwnerRef.current;
    let local: string[];
    if (owner !== null && owner !== uid) {
      // Account switch: the visible state belongs to a different user, so
      // reset to this user's own local bucket only (localStorage is shared
      // per browser — never merge another account's saves in).
      local = readJson<string[]>(userKey, []);
    } else {
      // First sign-in seeds the per-user key from the legacy guest key
      // (one-time migration); a returning owner just re-unions its bucket.
      local = unionSaves(readJson<string[]>(userKey, []), savedRef.current);
    }

    savesOwnerRef.current = uid;
    syncedForUidRef.current = uid;
    updateSaves(local, userKey);

    // Local/sample mode: localStorage only — never import Firestore here.
    if (!FIREBASE_SYNC) return;

    let cancelled = false;

    void (async () => {
      try {
        const saves = await import("@/lib/firebase/saves");
        if (cancelled) return;

        // 1) Cloud pull → union (local order first, then new cloud ids).
        const cloud = await saves.fetchMySaves(uid);
        if (cancelled || savesOwnerRef.current !== uid) return;
        const merged = unionSaves(savedRef.current, cloud);
        updateSaves(merged, userKey);

        // 2) Migrate local → cloud so the wishlist follows the account.
        const notInCloud = merged.filter((id) => !cloud.includes(id));
        if (notInCloud.length > 0) {
          await saves.addSaves(uid, notInCloud); // allSettled — never rejects
        }
        if (cancelled || savesOwnerRef.current !== uid) return;

        // 3) Live changes: ADD-only union. Removals are handled locally only,
        //    so a partial or flappy snapshot can never wipe a save the user
        //    just made on this device (multi-device removal falls back to the
        //    per-uid pull above). On error the helper logs once and we stop
        //    watching — never retry hot.
        stopSavesWatchRef.current?.();
        stopSavesWatchRef.current = saves.watchMySaves(
          uid,
          (ids) => {
            if (cancelled || savesOwnerRef.current !== uid) return;
            const prev = savedRef.current;
            const next = unionSaves(prev, ids);
            if (next.length === prev.length) return; // union only appends
            updateSaves(next, userKey);
          },
          () => {
            // Watcher disabled for the rest of this session; pull-on-sign-in
            // + optimistic writes keep working.
            stopSavesWatchRef.current = null;
          },
        );
      } catch (cause) {
        console.error("Wishlist cloud sync failed:", cause);
      }
    })();

    return () => {
      cancelled = true;
      stopSavesWatchRef.current?.();
      stopSavesWatchRef.current = null;
      // The async pull was interrupted (StrictMode double-invoke or an auth
      // transition) — let the next run redo it instead of skipping forever.
      if (syncedForUidRef.current === uid) syncedForUidRef.current = null;
    };
  }, [hydrated, uid, updateSaves]);

  const toggleSave = useCallback(
    (id: string) => {
      // Optimistic + synchronous: guest/e2e mode must work with no Firebase
      // and no sign-in, so this never awaits anything.
      const next = saved.includes(id) ? saved.filter((s) => s !== id) : [...saved, id];
      updateSaves(next, savesPersistKey(user?.uid ?? null));

      // Fire-and-forget cloud mirror while signed in with Firebase on.
      if (user && FIREBASE_SYNC) {
        const targetUid = user.uid;
        const saving = next.includes(id);
        void import("@/lib/firebase/saves")
          .then((saves) => (saving ? saves.addSave(targetUid, id) : saves.removeSave(targetUid, id)))
          .catch((cause: unknown) => {
            console.error("Wishlist cloud write failed:", cause);
            pushToast({
              title: saving ? "Saved locally" : "Removed locally",
              body: "Cloud sync failed — your change is safe on this device.",
              tone: "error",
            });
          });
      }
    },
    [pushToast, saved, savesPersistKey, updateSaves, user],
  );

  const isSaved = useCallback((id: string) => saved.includes(id), [saved]);

  const setPremium = useCallback(
    (value: boolean) => {
      setPremiumState(value);
      persist(PREMIUM_KEY, value);
    },
    [persist],
  );

  const recordFeeFreeSale = useCallback(() => {
    if (!premium || feeFreeSalesUsed >= 3) return false;
    const next = feeFreeSalesUsed + 1;
    setFeeFreeSalesUsed(next);
    persist(FEE_FREE_SALES_KEY, { month: currentMonthKey(), used: next } satisfies MonthlySalesUsage);
    return true;
  }, [feeFreeSalesUsed, persist, premium]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setAction = useCallback(
    (kind: string, id: string, value: string) => {
      const next = { ...actions, [`${kind}:${id}`]: value };
      setActions(next);
      persist(ACTIONS_KEY, next);
    },
    [actions, persist],
  );

  const hasAction = useCallback(
    (kind: string, id: string) => Boolean(actions[`${kind}:${id}`]),
    [actions],
  );

  const value = useMemo<CampusLoopState>(
    () => ({
      saved,
      hydrated,
      toggleSave,
      isSaved,
      premium,
      setPremium,
      feeFreeSalesUsed,
      recordFeeFreeSale,
      toasts,
      pushToast,
      dismissToast,
      actions,
      setAction,
      hasAction,
    }),
    [saved, hydrated, toggleSave, isSaved, premium, setPremium, feeFreeSalesUsed, recordFeeFreeSale, toasts, pushToast, dismissToast, actions, setAction, hasAction],
  );

  return (
    <Context.Provider value={value}>
      {children}
      {!hydrated ? null : <ToastViewport toasts={toasts} onDismiss={dismissToast} />}
    </Context.Provider>
  );
}

export function useCampusLoop(): CampusLoopState {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useCampusLoop must be used inside <CampusLoopProvider>");
  return ctx;
}

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  const tone: Record<Toast["tone"], string> = {
    success: "border-mint-400/40 bg-mint-500/12",
    info: "border-brand-400/40 bg-brand-500/12",
    premium: "border-flare-400/40 bg-flare-500/12",
    error: "border-rose-400/40 bg-rose-500/12",
  };
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-100 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto w-full max-w-sm rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${tone[toast.tone]}`}
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{toast.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-white/70">{toast.body}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 rounded-md px-1.5 py-0.5 text-xs text-white/50 transition hover:bg-white/10 hover:text-white"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
