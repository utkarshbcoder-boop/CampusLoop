"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
  toggleSave: (id: string) => void;
  isSaved: (id: string) => boolean;
  premium: boolean;
  setPremium: (value: boolean) => void;
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
const PREMIUM_KEY = "campusloop:premium";
const ACTIONS_KEY = "campusloop:actions";

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
  const [saved, setSaved] = useState<string[]>([]);
  const [premium, setPremiumState] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [actions, setActions] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSaved(readJson<string[]>(SAVED_KEY, []));
    setPremiumState(readJson<boolean>(PREMIUM_KEY, false));
    setActions(readJson<Record<string, string>>(ACTIONS_KEY, {}));
    setHydrated(true);
  }, []);

  const persist = useCallback((key: string, value: unknown) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Private mode or quota exceeded — the demo still works, it just forgets.
    }
  }, []);

  const toggleSave = useCallback(
    (id: string) => {
      setSaved((prev) => {
        const next = prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
        persist(SAVED_KEY, next);
        return next;
      });
    },
    [persist],
  );

  const isSaved = useCallback((id: string) => saved.includes(id), [saved]);

  const setPremium = useCallback(
    (value: boolean) => {
      setPremiumState(value);
      persist(PREMIUM_KEY, value);
    },
    [persist],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5200);
    },
    [],
  );

  const setAction = useCallback(
    (kind: string, id: string, value: string) => {
      setActions((prev) => {
        const next = { ...prev, [`${kind}:${id}`]: value };
        persist(ACTIONS_KEY, next);
        return next;
      });
    },
    [persist],
  );

  const hasAction = useCallback(
    (kind: string, id: string) => Boolean(actions[`${kind}:${id}`]),
    [actions],
  );

  const value = useMemo<CampusLoopState>(
    () => ({
      saved,
      toggleSave,
      isSaved,
      premium,
      setPremium,
      toasts,
      pushToast,
      dismissToast,
      actions,
      setAction,
      hasAction,
    }),
    [saved, toggleSave, isSaved, premium, setPremium, toasts, pushToast, dismissToast, actions, setAction, hasAction],
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
