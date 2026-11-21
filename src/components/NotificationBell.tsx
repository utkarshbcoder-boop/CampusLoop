"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { CloseIcon } from "@/components/Icon";
import { timeAgo } from "@/lib/format";
import {
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  watchMyNotifications,
  type AppNotification,
} from "@/lib/firebase/notifications";
import { cn } from "@/lib/utils";

const TYPE_EMOJI: Record<AppNotification["type"], string> = {
  interest: "🛍️",
  message: "💬",
  review: "⭐",
  bid: "🔨",
};

/** Message notifications point at a conversation; bids at the listing's page; interest/review at My Listings. */
function notificationPath(notification: AppNotification): string {
  if (notification.type === "message") return `/messages/${notification.target_id}`;
  if (notification.type === "bid") {
    // Bid notifications store the deep-link path (`/books/{id}` …) directly.
    return notification.target_id.startsWith("/") ? notification.target_id : "/marketplace";
  }
  return "/my-listings";
}

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [failed, setFailed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const uid = user?.uid ?? null;

  useEffect(() => {
    if (!uid) {
      setItems([]);
      return;
    }
    let active = true;
    setFailed(false);
    const unsubscribe = watchMyNotifications(
      uid,
      (next) => {
        if (active) setItems(next);
      },
      () => {
        // Firestore may be locked down (sample mode / denied rules) — hide the bell silently.
        if (!active) return;
        console.error("NotificationBell: could not load notifications, hiding the bell.");
        setFailed(true);
      },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [uid]);

  // Close the panel on outside clicks and Escape.
  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !wrapRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (!uid || failed) return null;

  const unread = items.filter((item) => !item.read).length;

  async function openNotification(notification: AppNotification) {
    try {
      await markNotificationRead(notification.id);
    } catch (cause) {
      console.error("Failed to mark notification read:", cause);
    }
    setOpen(false);
    router.push(notificationPath(notification));
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm transition hover:bg-white/10"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[85vw] overflow-hidden rounded-xl border border-white/10 bg-ink-850 shadow-2xl"
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/8 px-3 py-2">
            <p className="text-xs font-semibold tracking-wider text-white/45 uppercase">Notifications</p>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => void markAllNotificationsRead(items)}
                className="text-[11px] font-semibold text-brand-200 transition hover:text-brand-100"
              >
                Mark all as read
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-white/50">{"You're all caught up."}</p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto p-2">
              {items.map((notification) => (
                <li
                  key={notification.id}
                  className={cn(
                    "relative rounded-lg",
                    notification.read ? "" : "bg-brand-500/10 ring-1 ring-brand-400/25",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => void openNotification(notification)}
                    className="flex w-full items-start gap-2.5 rounded-lg py-2.5 pr-8 pl-3 text-left transition hover:bg-white/5"
                  >
                    <span className="text-base" aria-hidden>
                      {TYPE_EMOJI[notification.type]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        {notification.read ? null : (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" aria-hidden />
                        )}
                        <span className="truncate text-xs font-semibold text-white">{notification.title}</span>
                      </span>
                      <span className="mt-0.5 block cl-line-clamp-2 text-[11px] leading-relaxed text-white/55">
                        {notification.body}
                      </span>
                      <span className="mt-1 block text-[10px] text-white/35" suppressHydrationWarning>
                        {timeAgo(notification.created_at)}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Dismiss notification: ${notification.title}`}
                    onClick={() => void deleteNotification(notification.id)}
                    className="absolute top-2 right-1.5 rounded-md p-1 text-white/35 transition hover:bg-white/10 hover:text-white"
                  >
                    <CloseIcon width={12} height={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
