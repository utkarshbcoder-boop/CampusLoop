"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/AuthProvider";
import { timeAgo } from "@/lib/format";
import {
  getConversation,
  markConversationRead,
  sendMessage,
  watchMessages,
  type Conversation,
  type Message,
} from "@/lib/firebase/messaging";

type ThreadStatus =
  | "loading"
  | "ready"
  | "signed-out"
  | "not-found"
  | "denied"
  | "error";

const MESSAGE_MAX_LENGTH = 2000;

function isPermissionDenied(cause: unknown): boolean {
  return (
    typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    (cause as { code?: unknown }).code === "permission-denied"
  );
}

function ThreadNotice({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-14">
      <div className="cl-panel cl-panel-solid p-6">
        <h1 className="text-lg font-bold text-white">{title}</h1>
        <div className="mt-2 text-sm text-white/60">{children}</div>
        {action}
        <Link href="/messages" className="cl-btn cl-btn-ghost mt-4">
          Back to messages
        </Link>
      </div>
    </section>
  );
}

/**
 * A single buyer <-> seller conversation.
 *
 * Loads the conversation first (participant check + friendly notices), then
 * subscribes to its messages, auto-marks the thread read once, and sends via
 * the shared sendMessage helper. The conversation document is re-fetched
 * silently after each send so unread math stays accurate even though the
 * subscription only watches messages.
 */
export function ThreadView({ conversationId }: { conversationId: string }) {
  const { user, loading } = useAuth();
  const uid = user?.uid ?? "";

  const [status, setStatus] = useState<ThreadStatus>("loading");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesError, setMessagesError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const markedReadRef = useRef(false);
  const lastMessageIdRef = useRef<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 1. Load the conversation (participant-only) when auth settles.
  useEffect(() => {
    if (loading) return;
    if (!uid) {
      setStatus("signed-out");
      setConversation(null);
      return;
    }

    let active = true;
    setStatus("loading");
    setConversation(null);
    setMessages([]);
    setMessagesError("");
    setSendError("");
    markedReadRef.current = false;
    lastMessageIdRef.current = null;

    void (async () => {
      try {
        const loaded = await getConversation(conversationId);
        if (!active) return;
        if (!loaded) {
          setStatus("not-found");
          return;
        }
        if (loaded.buyer_id !== uid && loaded.seller_id !== uid) {
          setStatus("denied");
          return;
        }
        setConversation(loaded);
        setStatus("ready");
      } catch (cause) {
        console.error("Failed to load conversation:", cause);
        if (!active) return;
        setStatus(isPermissionDenied(cause) ? "denied" : "error");
      }
    })();

    return () => {
      active = false;
    };
  }, [conversationId, loading, uid, attempt]);

  // 2. Live messages, oldest first.
  useEffect(() => {
    if (status !== "ready" || !uid) return;

    let active = true;
    let unsubscribe: (() => void) | null = null;
    setMessagesError("");
    try {
      unsubscribe = watchMessages(
        conversationId,
        (items) => {
          if (active) setMessages(items);
        },
        () => {
          if (active) setMessagesError("Could not load messages. Please try again.");
        },
      );
    } catch (cause) {
      console.error("watchMessages failed:", cause);
      if (active) setMessagesError("Could not load messages. Please try again.");
    }
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [conversationId, status, uid]);

  // 3. Clear unread exactly once per conversation load (ref-guarded).
  useEffect(() => {
    if (status !== "ready" || !conversation || !uid) return;
    if (markedReadRef.current) return;
    if (conversation.buyer_id !== uid && conversation.seller_id !== uid) return;
    markedReadRef.current = true;
    markConversationRead(conversation, uid).catch((cause: unknown) => {
      console.error("Failed to mark conversation read:", cause);
    });
  }, [status, conversation, uid]);

  // 4. Follow the newest message when it is ours or the first load.
  useEffect(() => {
    const list = listRef.current;
    const last = messages[messages.length - 1];
    if (!list || !last || last.id === lastMessageIdRef.current) return;
    const shouldScroll = lastMessageIdRef.current === null || last.sender_id === uid;
    lastMessageIdRef.current = last.id;
    if (shouldScroll) list.scrollTop = list.scrollHeight;
  }, [messages, uid]);

  async function handleSend() {
    if (status !== "ready" || !conversation || !uid || sending) return;
    const text = draft.trim();
    if (!text) return;

    setSending(true);
    setSendError("");
    try {
      await sendMessage(conversation, uid, text);
      setDraft("");
      try {
        const refreshed = await getConversation(conversation.id);
        if (refreshed) setConversation(refreshed);
      } catch (cause) {
        // Preview refresh is best-effort; the thread still works without it.
        console.error("Failed to refresh conversation:", cause);
      }
    } catch (cause) {
      console.error("Failed to send message:", cause);
      setSendError("Could not send. Try again.");
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleSend();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void handleSend();
  }

  if (status === "loading") {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-14">
        <p className="text-sm text-white/50">Loading conversation…</p>
      </section>
    );
  }

  if (status === "signed-out") {
    return (
      <ThreadNotice
        title="Sign in to view this conversation"
        action={
          <Link
            href={`/login?returnTo=${encodeURIComponent(`/messages/${conversationId}`)}`}
            className="cl-btn cl-btn-primary mt-4"
          >
            Sign in
          </Link>
        }
      >
        Sign in to see your conversations.
      </ThreadNotice>
    );
  }

  if (status === "not-found") {
    return (
      <ThreadNotice title="Conversation not found">
        This conversation no longer exists or has been removed.
      </ThreadNotice>
    );
  }

  if (status === "denied") {
    return (
      <ThreadNotice title="Conversation unavailable">
        You don&apos;t have access to this conversation.
      </ThreadNotice>
    );
  }

  if (status === "error" || !conversation) {
    return (
      <ThreadNotice
        title="Could not load this conversation"
        action={
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="cl-btn cl-btn-primary mt-4"
          >
            Try again
          </button>
        }
      >
        Something went wrong while opening this thread. Please try again.
      </ThreadNotice>
    );
  }

  const targetHref = conversation.target_type === "listing" ? "/marketplace" : "/homes";
  const noun = conversation.target_type === "listing" ? "listing" : "property";
  const isBuyer = conversation.buyer_id === uid;
  const roleLine = isBuyer
    ? `You asked about this ${noun}`
    : `Someone asked about your ${noun}`;

  return (
    <div className="mx-auto flex h-[calc(100dvh_-_6rem)] min-h-72 w-full max-w-3xl flex-col px-4 pb-4 pt-3">
      <header className="shrink-0 border-b border-white/10 pb-3">
        <Link
          href="/messages"
          className="text-xs text-white/45 transition hover:text-white"
        >
          ← All conversations
        </Link>
        <div className="mt-1.5 flex items-center justify-between gap-3">
          <h1 className="truncate text-lg font-bold text-white sm:text-xl">
            {conversation.target_title}
          </h1>
          <Link href={targetHref} className="cl-btn cl-btn-ghost shrink-0 px-3 py-1.5 text-xs">
            View {noun}
          </Link>
        </div>
        <p className="mt-1 text-xs text-white/45">{roleLine}</p>
      </header>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto py-4">
        {messagesError ? (
          <p
            role="alert"
            className="mb-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
          >
            {messagesError}
          </p>
        ) : null}
        {!messagesError && messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-white/45">
            No messages yet — say hello and agree on price, payment, and handover.
          </p>
        ) : null}
        <ol className="flex flex-col gap-3">
          {messages.map((message) => {
            const outgoing = message.sender_id === uid;
            return (
              <li key={message.id} className={`flex ${outgoing ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[70%] ${
                    outgoing ? "bg-brand-500/18 ring-1 ring-brand-400/35" : "cl-panel"
                  }`}
                >
                  <p
                    className={`whitespace-pre-wrap break-words text-sm ${
                      outgoing ? "text-white" : "text-white/80"
                    }`}
                  >
                    {message.text}
                  </p>
                  <p className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-white/40">
                    <span>{timeAgo(message.created_at)}</span>
                    {outgoing && message.read ? (
                      <span title="Read" aria-label="Read">
                        ✓✓
                      </span>
                    ) : null}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="shrink-0 border-t border-white/10 pt-3">
        {sendError ? (
          <p role="alert" className="mb-2 text-xs text-rose-300">
            {sendError}
          </p>
        ) : null}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <label htmlFor="thread-message" className="sr-only">
            Message
          </label>
          <textarea
            id="thread-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={MESSAGE_MAX_LENGTH}
            rows={2}
            placeholder="Write a message… (Enter to send, Shift+Enter for a new line)"
            className="cl-input min-h-11 min-w-0 flex-1 resize-none"
          />
          <button
            type="submit"
            disabled={sending || draft.trim().length === 0}
            className="cl-btn cl-btn-primary shrink-0 disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </form>
        <p className="mt-1 text-right text-[10px] text-white/35" aria-hidden>
          {draft.length}/{MESSAGE_MAX_LENGTH}
        </p>
      </div>
    </div>
  );
}
