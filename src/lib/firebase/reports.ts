/**
 * Reports / moderation queue (feature 2).
 *
 * Contract (must match firestore.rules):
 *  - Deterministic IDs `${targetType}_${targetId}_${reporterId}` — one open
 *    report per reporter per target (duplicate detection is a doc-ID check).
 *  - The document itself carries NO `id` field (rules hasOnly excludes it).
 *  - status starts as "open"; only an admin may flip it to resolved/dismissed.
 *  - Reads are admin-only — reporters can't see the queue or others' reports.
 */

import { collection, doc, getDoc, runTransaction, where, getDocs, query } from "firebase/firestore";
import { db } from "./config";

export const REPORT_REASONS = [
  "spam",
  "scam",
  "misleading",
  "inappropriate",
  "harassment",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];
export type ReportTargetType = "listing" | "home" | "review";
export type ReportStatus = "open" | "resolved" | "dismissed";

export interface Report {
  /** Document id (assigned by ID pattern, mirrored client-side for UI keys). */
  id: string;
  target_type: ReportTargetType;
  target_id: string;
  reporter_id: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  created_at: string;
}

export function reportIdFor(
  targetType: ReportTargetType,
  targetId: string,
  reporterId: string,
): string {
  return `${targetType}_${targetId}_${reporterId}`;
}

/**
 * File a report against a listing, home, or review.
 * Returns "exists" when this reporter already reported the target.
 */
export async function submitReport(input: {
  targetType: ReportTargetType;
  targetId: string;
  reporterId: string;
  reason: ReportReason;
  details?: string;
}): Promise<"created" | "exists"> {
  const { targetType, targetId, reporterId, reason, details } = input;
  const reportId = reportIdFor(targetType, targetId, reporterId);
  const reportRef = doc(db, "reports", reportId);
  const trimmed = (details ?? "").trim().slice(0, 1000);

  return runTransaction(db, async (transaction) => {
    const existing = await transaction.get(reportRef);
    if (existing.exists()) return "exists";

    transaction.set(reportRef, {
      target_type: targetType,
      target_id: targetId,
      reporter_id: reporterId,
      reason,
      details: trimmed,
      status: "open",
      created_at: new Date().toISOString(),
    } satisfies Record<string, unknown>);
    return "created";
  });
}

/** Has this reporter already reported the target? (pre-check for nicer UX) */
export async function hasReported(
  targetType: ReportTargetType,
  targetId: string,
  reporterId: string,
): Promise<boolean> {
  try {
    const snapshot = await getDoc(doc(db, "reports", reportIdFor(targetType, targetId, reporterId)));
    return snapshot.exists();
  } catch (cause) {
    console.error("hasReported failed:", cause);
    return false;
  }
}

/** Admin-only: every report (rules deny non-admin reads). Newest first. */
export async function listReports(): Promise<Report[]> {
  try {
    const snapshot = await getDocs(query(collection(db, "reports"), where("status", "in", ["open", "resolved", "dismissed"])));
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as Report))
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  } catch (cause) {
    console.error("listReports failed:", cause);
    return [];
  }
}
