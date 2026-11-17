"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { watchMyConversations, type Conversation } from "@/lib/firebase/messaging";
import { timeAgo } from "@/lib/format";

/**
 * Inbox for buyer <-> seller conversations (feature 9).
 *
 * Subscribes to both sides of the thread list (buyer_id / seller_id) via
 * watchMyConversations. Firestore is deny-all until rules are deployed and
 * sample mode has no backend, so every failure degrades to an inline alert
 * rather than a blank page.
 */
function roleLabel(conversation: Conversation, uid: string): string {
  const noun = conversation.target_type === "listing" ? "listing" : "property";
  return conversation.buyer_id === uid
    ? `You asked about this ${noun}`
    : `Someone asked about your ${noun}`;
}

export default function MessagesPage() {
  const { user, loading } = useAuth();
  const uid = user?.uid ?? "";
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!uid) {
      setConversations(null);
      setError("");
      return;
    }

    let active = true;
    let unsubscribe: (() => void) | null = null;
    setConversations(null);
    setError("");
    try {
      unsubscribe = watchMyConversations(
        uid,
        (items) => {
          if (active) setConversations(items);
        },
        () => {
          if (active) setError("Could not load your conversations. Please try again.");
        },
      );
    } catch (cause) {
      console.error("watchMyConversations failed:", cause);
      if (active) setError("Could not load your conversations. Please try again.");
    }
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [loading, uid]);

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight text-white">Messages</h1>
      <p className="mt-2 text-sm text-white/50">
        Your conversations with buyers and sellers, newest activity first.
      </p>
      {loading ? (
        <p className="mt-6 text-sm text-white/50">Checking your account…</p>
      ) : !uid ? (
        <div className="cl-panel cl-panel-solid mt-6 p-6">
          <p className="text-sm text-white/60">Sign in to see your conversations.</p>
          <Link href="/login" className="cl-btn cl-btn-primary mt-4">
            Sign in
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          {error ? (
            <p role="alert" className="mb-4 text-sm text-rose-300">
              {error}
            </p>
          ) : null}
          {conversations === null && !error ? (
            <p className="text-sm text-white/50">Loading conversations…</p>
          ) : null}
          {conversations !== null && conversations.length === 0 ? (
            <div className="cl-panel cl-panel-solid p-6">
              <p className="text-sm text-white/60">
                No conversations yet — message a seller from any listing page.
              </p>
              <Link href="/marketplace" className="cl-btn cl-btn-ghost mt-4">
                Browse listings
              </Link>
            </div>
          ) : null}
          {conversations !== null && conversations.length > 0 ? (
            <ul className="grid gap-3">
              {conversations.map((conversation) => {
                const unread =
                  uid === conversation.buyer_id
                    ? conversation.buyer_unread
                    : conversation.seller_unread;
                return (
                  <li key={conversation.id}>
                    <Link
                      href={`/messages/${conversation.id}`}
                      className="cl-panel cl-panel-solid flex items-start gap-3 p-4 transition hover:border-white/25"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <h2 className="truncate text-sm font-semibold text-white">
                            {conversation.target_title}
                          </h2>
                          <span className="shrink-0 text-xs text-white/40">
                            {timeAgo(conversation.last_at || conversation.created_at)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-brand-300">
                          {roleLabel(conversation, uid)}
                        </p>
                        <p className="mt-1 truncate text-sm text-white/55">
                          {conversation.last_message || "No messages yet"}
                        </p>
                      </div>
                      {unread > 0 ? (
                        <span
                          role="img"
                          aria-label={`${unread} unread`}
                          className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-rose-500 px-2 text-[11px] font-bold text-white"
                        >
                          {unread}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      )}
    </section>
  );
}
