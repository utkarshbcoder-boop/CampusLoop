"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useCollection } from "@/lib/firebase/hooks";

/* ------------------------------------------------------------------ */
/* Collection metadata                                                 */
/* ------------------------------------------------------------------ */

const COLLECTION_META: Record<string, { label: string; emoji: string; keyFields: string[] }> = {
  colleges:       { label: "Colleges",       emoji: "🏛️", keyFields: ["name", "city", "slug"] },
  profiles:       { label: "Profiles",       emoji: "👤", keyFields: ["name", "handle", "email", "college_id"] },
  listings:       { label: "Books",          emoji: "📚", keyFields: ["title", "seller_id", "price", "condition"] },
  equipment:      { label: "Equipment",      emoji: "💻", keyFields: ["name", "owner_id", "daily_rate", "category"] },
  pg_listings:    { label: "PG & Rooms",     emoji: "🏠", keyFields: ["title", "owner_id", "rent", "type"] },
  teammate_posts: { label: "Teams",          emoji: "🧑‍💻", keyFields: ["title", "poster_id", "skills_needed"] },
  skill_profiles: { label: "Skills",         emoji: "🎯", keyFields: ["user_id", "skills", "hourly_rate"] },
  events:         { label: "Events",         emoji: "🎤", keyFields: ["title", "organizer_id", "date", "venue"] },
  services:       { label: "Services",       emoji: "🛠️", keyFields: ["name", "provider_id", "category", "rating"] },
  opportunities:  { label: "Opportunities",  emoji: "💼", keyFields: ["title", "company", "type", "stipend"] },
  transactions:   { label: "Transactions",   emoji: "💰", keyFields: ["description", "amount", "kind", "occurred_at"] },
  subscriptions:  { label: "Subscriptions",  emoji: "📋", keyFields: ["college_id", "plan", "status"] },
  sponsorships:   { label: "Sponsorships",   emoji: "📣", keyFields: ["title", "brand", "status", "budget"] },
  notifications:  { label: "Notifications",  emoji: "🔔", keyFields: ["title", "type", "target"] },
};

/* ------------------------------------------------------------------ */
/* Field-based document editor                                         */
/* ------------------------------------------------------------------ */

function FieldEditor({
  field,
  value,
  onChange,
}: {
  field: string;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const strVal = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value ?? "");
  const isArray = Array.isArray(value);
  const isObject = typeof value === "object" && value !== null && !isArray;
  const isBool = typeof value === "boolean";
  const isNum = typeof value === "number";

  if (isBool) {
    return (
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={value as boolean}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-white/5"
        />
        <span className="text-xs text-white/70">{field}</span>
      </label>
    );
  }

  if (isArray || isObject) {
    return (
      <label className="block">
        <span className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">
          {field} {isArray ? `[${(value as unknown[]).length}]` : "{obj}"}
        </span>
        <textarea
          value={strVal}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              // Keep as string if invalid JSON
            }
          }}
          rows={Math.min(6, strVal.split("\n").length + 1)}
          className="cl-input mt-1 font-mono text-[11px] leading-relaxed"
          spellCheck={false}
        />
      </label>
    );
  }

  return (
    <label className="block">
      <span className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">
        {field}
      </span>
      <input
        type={isNum ? "number" : "text"}
        value={strVal}
        onChange={(e) =>
          onChange(isNum ? Number(e.target.value) : e.target.value)
        }
        className="cl-input mt-1 text-xs"
        readOnly={field === "id"}
      />
    </label>
  );
}

function DocumentEditor({
  collectionName,
  initial,
  onClose,
}: {
  collectionName: string;
  initial: Record<string, unknown> | null;
  onClose: () => void;
}) {
  const isNew = !initial;
  const [fields, setFields] = useState<Record<string, unknown>>(
    initial ? { ...initial } : { id: "" },
  );
  const [viewMode, setViewMode] = useState<"form" | "json">("form");
  const [json, setJson] = useState(JSON.stringify(fields, null, 2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync JSON when switching modes
  useEffect(() => {
    if (viewMode === "json") setJson(JSON.stringify(fields, null, 2));
  }, [viewMode, fields]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const data = viewMode === "json" ? JSON.parse(json) : fields;
      if (!data.id || typeof data.id !== "string") {
        throw new Error("Document must have a string 'id' field.");
      }
      await setDoc(doc(db, collectionName, data.id), data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid data");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, val: unknown) => {
    setFields((prev) => ({ ...prev, [key]: val }));
  };

  const addField = () => {
    const name = prompt("Field name:");
    if (name && !fields[name]) {
      setFields((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const removeField = (key: string) => {
    if (key === "id") return;
    setFields((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close editor"
      />
      <div className="cl-panel-solid relative z-10 w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <h2 className="text-lg font-bold text-white">
            {isNew ? "➕ Add New Document" : "✏️ Edit Document"}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "form" ? "json" : "form")}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-medium text-white/60 transition hover:bg-white/5"
            >
              {viewMode === "form" ? "{ } JSON" : "📝 Form"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm text-white/50 hover:bg-white/8 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-300">
              ❌ {error}
            </div>
          )}

          <p className="mb-4 text-[11px] text-white/40">
            ⚡ Changes save instantly and push to all users worldwide in real-time.
          </p>

          {viewMode === "form" ? (
            <div className="space-y-3">
              {Object.entries(fields).map(([key, val]) => (
                <div key={key} className="group flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <FieldEditor
                      field={key}
                      value={val}
                      onChange={(v) => updateField(key, v)}
                    />
                  </div>
                  {key !== "id" && (
                    <button
                      type="button"
                      onClick={() => removeField(key)}
                      className="mt-5 shrink-0 rounded px-1.5 py-0.5 text-[10px] text-rose-400/60 opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/15 hover:text-rose-300"
                      title="Remove field"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addField}
                className="mt-2 rounded-lg border border-dashed border-white/15 px-4 py-2 text-xs text-white/40 transition hover:border-white/30 hover:text-white/60"
              >
                + Add Field
              </button>
            </div>
          ) : (
            <textarea
              value={json}
              onChange={(e) => setJson(e.target.value)}
              rows={20}
              className="cl-input font-mono text-xs leading-relaxed"
              spellCheck={false}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/8 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="cl-btn cl-btn-ghost px-4 py-2 text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="cl-btn cl-btn-primary px-5 py-2 text-xs"
          >
            {saving ? "Saving…" : isNew ? "✨ Create Document" : "💾 Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Read-only document detail modal                                     */
/* ------------------------------------------------------------------ */

function DocumentViewer({
  row,
  onClose,
  onEdit,
  onDelete,
}: {
  row: Record<string, unknown>;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="cl-panel-solid relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <h2 className="text-lg font-bold text-white">
            📄 {String(row.name || row.title || row.handle || row.id)}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-md px-2.5 py-1 text-[11px] font-medium text-brand-300 transition hover:bg-brand-500/15"
            >
              ✏️ Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md px-2.5 py-1 text-[11px] font-medium text-rose-400 transition hover:bg-rose-500/15"
            >
              🗑️ Delete
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm text-white/50 hover:bg-white/8 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <dl className="space-y-3">
            {Object.entries(row).map(([key, val]) => (
              <div key={key}>
                <dt className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">
                  {key}
                </dt>
                {typeof val === "object" && val !== null ? (
                  <dd>
                    <pre className="mt-1 max-h-48 overflow-auto rounded-lg bg-white/5 p-3 font-mono text-[11px] leading-relaxed text-white/70">
                      {JSON.stringify(val, null, 2)}
                    </pre>
                  </dd>
                ) : (
                  <dd className="mt-0.5 break-words text-xs text-white/80">
                    {val === null || val === undefined || val === ""
                      ? "—"
                      : typeof val === "boolean"
                        ? val
                          ? "✅ true"
                          : "❌ false"
                        : String(val)}
                  </dd>
                )}
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Confirm delete modal                                                */
/* ------------------------------------------------------------------ */

function ConfirmDelete({
  docId,
  collectionName,
  docPreview,
  onClose,
}: {
  docId: string;
  collectionName: string;
  docPreview?: string;
  onClose: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="cl-panel-solid relative z-10 w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <p className="text-center text-3xl">🗑️</p>
        <h2 className="mt-3 text-center text-lg font-bold text-white">Delete Document?</h2>
        <p className="mt-2 text-center text-sm text-white/50">
          ID: <code className="rounded bg-white/8 px-1.5 py-0.5 text-xs">{docId}</code>
        </p>
        {docPreview && (
          <p className="mt-1 text-center text-xs text-white/35">{docPreview}</p>
        )}
        <p className="mt-3 text-center text-xs text-rose-300/80">
          ⚠️ This action is permanent and immediately affects all users worldwide.
          {collectionName === "profiles" && " This will remove the user from CampusLoop."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="cl-btn cl-btn-ghost px-4 py-2 text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={async () => {
              setDeleting(true);
              await deleteDoc(doc(db, collectionName, docId));
              onClose();
            }}
            className="cl-btn px-4 py-2 text-xs font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #f43f5e, #e11d48)",
              boxShadow: "0 10px 30px -14px rgba(244,63,94,0.7)",
            }}
          >
            {deleting ? "Deleting…" : "🗑️ Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Document preview card                                               */
/* ------------------------------------------------------------------ */

function DocCard({
  row,
  columns,
  onEdit,
  onDelete,
  onView,
  formatCell,
}: {
  row: Record<string, unknown>;
  columns: string[];
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  formatCell: (val: unknown) => string;
}) {
  return (
    <div
      onClick={onView}
      className="cl-panel group flex cursor-pointer flex-col gap-2 p-4 transition hover:border-white/15"
    >
      {/* ID badge */}
      <div className="flex items-center justify-between">
        <code className="rounded bg-white/6 px-2 py-0.5 text-[10px] text-white/40">
          {row.id as string}
        </code>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md px-2 py-1 text-[11px] font-medium text-brand-300 transition hover:bg-brand-500/15"
          >
            ✏️ Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md px-2 py-1 text-[11px] font-medium text-rose-400 transition hover:bg-rose-500/15"
          >
            🗑️
          </button>
        </div>
      </div>
      {/* Key fields */}
      <div className="space-y-1">
        {columns.filter((c) => c !== "id").slice(0, 5).map((col) => (
          <div key={col} className="flex items-baseline gap-2">
            <span className="shrink-0 text-[10px] font-medium text-white/30 uppercase w-20 truncate">
              {col}
            </span>
            <span className="text-xs text-white/70 truncate">
              {formatCell(row[col])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main collection CRUD page                                           */
/* ------------------------------------------------------------------ */

export default function AdminCollectionPage() {
  const params = useParams();
  const router = useRouter();
  const collectionName = params.collection as string;
  const meta = COLLECTION_META[collectionName];

  const { data, loading, error } = useCollection<{ id: string } & Record<string, unknown>>(
    collectionName,
  );

  const [search, setSearch] = useState("");
  const [editDoc, setEditDoc] = useState<Record<string, unknown> | null | "new">(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewDoc, setViewDoc] = useState<Record<string, unknown> | null>(null);
  const [viewType, setViewType] = useState<"table" | "cards">("table");

  // Redirect if unknown collection
  useEffect(() => {
    if (!meta) router.replace("/admin");
  }, [meta, router]);

  // Filter data by search
  const filtered = useMemo(() => {
    if (!search) return data;
    const term = search.toLowerCase();
    return data.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(term),
    );
  }, [data, search]);

  // Get displayable columns
  const columns = useMemo(() => {
    if (data.length === 0) return meta?.keyFields ?? ["id"];
    const keys = Object.keys(data[0]);
    // Prioritise configured key fields, then fill rest
    const configured = meta?.keyFields ?? [];
    const priority = ["id", ...configured];
    const sorted = [
      ...priority.filter((k) => keys.includes(k)),
      ...keys.filter((k) => !priority.includes(k)).sort(),
    ];
    return sorted.slice(0, 8);
  }, [data, meta]);

  const formatCell = useCallback((val: unknown): string => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "boolean") return val ? "✅" : "❌";
    if (Array.isArray(val)) return val.length > 0 ? `[${val.length} items]` : "[]";
    if (typeof val === "object") return "{…}";
    const s = String(val);
    return s.length > 50 ? s.slice(0, 47) + "…" : s;
  }, []);

  const getDocPreview = (row: Record<string, unknown>) => {
    const nameField = row.name || row.title || row.handle || row.description;
    return nameField ? String(nameField) : undefined;
  };

  if (!meta) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-white">
            <span>{meta.emoji}</span>
            {meta.label}
          </h1>
          <p className="mt-1 text-sm text-white/45">
            {loading ? "Loading…" : `${data.length} documents · Changes sync to all users in real-time`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            <button
              type="button"
              onClick={() => setViewType("table")}
              className={`px-3 py-1.5 text-xs font-medium transition ${viewType === "table" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}
            >
              ☰ Table
            </button>
            <button
              type="button"
              onClick={() => setViewType("cards")}
              className={`px-3 py-1.5 text-xs font-medium transition ${viewType === "cards" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}
            >
              ▦ Cards
            </button>
          </div>
          <button
            type="button"
            onClick={() => setEditDoc("new")}
            className="cl-btn cl-btn-primary px-4 py-2 text-xs"
          >
            ➕ Add New
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-5 py-3 text-sm text-rose-300">
          ❌ Error: {error}
        </div>
      )}

      {/* Admin tip for profiles */}
      {collectionName === "profiles" && !loading && (
        <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/8 px-5 py-3">
          <p className="text-xs font-semibold text-amber-300">👮 User Management</p>
          <p className="mt-1 text-[11px] text-white/50">
            You have full control over user profiles. Delete any abusive user, edit their info,
            or add new users. Changes apply instantly for everyone.
          </p>
        </div>
      )}

      {/* Search + stats */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`🔍 Search ${meta.label.toLowerCase()}… (name, ID, any field)`}
          className="cl-input max-w-md flex-1"
        />
        {search && (
          <span className="text-xs text-white/40">
            {filtered.length} of {data.length} shown
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-500/30 border-t-brand-500" />
            <p className="text-xs text-white/40">Loading from Firestore…</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="cl-panel cl-panel-solid py-16 text-center">
          <p className="text-3xl">📭</p>
          <p className="mt-3 text-sm text-white/50">
            {search ? "No matching documents found." : "This collection is empty."}
          </p>
        </div>
      ) : viewType === "cards" ? (
        /* Card view */
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => (
            <DocCard
              key={row.id}
              row={row}
              columns={columns}
              onEdit={() => setEditDoc(row)}
              onDelete={() => setDeleteId(row.id)}
              onView={() => setViewDoc(row as Record<string, unknown>)}
              formatCell={formatCell}
            />
          ))}
        </div>
      ) : (
        /* Table view */
        <div className="cl-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead>
                <tr className="border-b border-white/8">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-[10px] font-semibold tracking-wider text-white/40 uppercase"
                    >
                      {col}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-[10px] font-semibold tracking-wider text-white/40 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setViewDoc(row as Record<string, unknown>)}
                    className="cursor-pointer border-b border-white/5 transition hover:bg-white/3"
                  >
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="max-w-[200px] truncate px-4 py-2.5 text-xs text-white/70"
                      >
                        {formatCell((row as Record<string, unknown>)[col])}
                      </td>
                    ))}
                        <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setEditDoc(row)}
                          className="rounded-md px-2 py-1 text-[11px] font-medium text-brand-300 transition hover:bg-brand-500/15"
                          title="Edit this document"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(row.id)}
                          className="rounded-md px-2 py-1 text-[11px] font-medium text-rose-400 transition hover:bg-rose-500/15"
                          title="Delete this document"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-white/8 px-4 py-2.5 text-[11px] text-white/30">
            Showing {filtered.length} of {data.length} documents · ⚡ Real-time sync active · Changes auto-update for all users
          </div>
        </div>
      )}

      {/* Bulk actions bar */}
      {!loading && data.length > 0 && (
        <div className="mt-6 rounded-xl border border-white/8 bg-white/3 px-5 py-3">
          <p className="text-[10px] font-semibold tracking-wider text-white/40 uppercase mb-2">
            Admin Actions
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditDoc("new")}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              ➕ Add Document
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`⚠️ Delete ALL ${data.length} documents in "${collectionName}"? This cannot be undone!`)) {
                  Promise.all(data.map((d) => deleteDoc(doc(db, collectionName, d.id))));
                }
              }}
              className="rounded-lg border border-rose-500/20 px-3 py-1.5 text-xs text-rose-400/60 transition hover:bg-rose-500/10 hover:text-rose-300"
            >
              🗑️ Clear All
            </button>
          </div>
        </div>
      )}

      {/* Document viewer modal */}
      {viewDoc !== null && (
        <DocumentViewer
          row={viewDoc}
          onClose={() => setViewDoc(null)}
          onEdit={() => {
            setEditDoc(viewDoc);
            setViewDoc(null);
          }}
          onDelete={() => {
            setDeleteId(viewDoc.id as string);
            setViewDoc(null);
          }}
        />
      )}

      {/* Editor modal */}
      {editDoc !== null && (
        <DocumentEditor
          collectionName={collectionName}
          initial={editDoc === "new" ? null : (editDoc as Record<string, unknown>)}
          onClose={() => setEditDoc(null)}
        />
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <ConfirmDelete
          docId={deleteId}
          collectionName={collectionName}
          docPreview={getDocPreview(data.find((d) => d.id === deleteId) ?? {})}
          onClose={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
