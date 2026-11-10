/**
 * Pure quota/usage business logic — dependency-free, no fs/db/server-only.
 *
 * This module holds every calculation, validation rule, daily-window rule,
 * merge rule and result type used by the AI quota system. It is safe to import
 * from unit tests (plain tsx), client code, and server-only adapters alike.
 *
 * Server adapters (`json-usage.ts`, `pg-usage.ts`) import these helpers to do
 * the actual math, so the logic is tested once and reused everywhere.
 */
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Result types
// ─────────────────────────────────────────────────────────────────────────────

export interface UsageStatus {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Daily-window helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Current UTC day as YYYY-MM-DD. Override via `now` for deterministic tests. */
export function today(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Next UTC midnight as ISO string. Override via `now` for deterministic tests. */
export function nextReset(now: Date = new Date()): string {
  const d = new Date(now);
  d.setUTCHours(24, 0, 0, 0);
  return d.toISOString();
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

export const entrySchema = z.object({
  userId: z.string(),
  day: z.string(), // YYYY-MM-DD (UTC)
  count: z.number().int().min(0),
});

export type UsageEntry = z.infer<typeof entrySchema>;

/** Throws on invalid input — used by adapters before persisting. */
export function assertValidEntry(entry: unknown): UsageEntry {
  return entrySchema.parse(entry);
}

export function assertValidLimit(limit: number): void {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(`AI_DAILY_LIMIT phải là số nguyên ≥ 1, nhận được: ${limit}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure calculations — the heart of the quota system
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a UsageStatus from raw inputs. Pure: no I/O, no env reads.
 *
 * `remaining` is clamped to 0 so callers never see a negative allowance.
 */
export function computeStatus(
  used: number,
  limit: number,
  now: Date = new Date()
): UsageStatus {
  assertValidLimit(limit);
  return {
    used: Math.max(0, used),
    limit,
    remaining: Math.max(0, limit - used),
    resetsAt: nextReset(now),
  };
}

/**
 * Apply one consumption. Returns the new used count.
 *
 * Throws `AiError('quota')` semantics via the returned `wouldExceed` flag so
 * callers can map it to their own error type. Pure: no side effects.
 */
export function applyConsume(
  used: number,
  limit: number
): { used: number; wouldExceed: boolean } {
  assertValidLimit(limit);
  if (used >= limit) return { used, wouldExceed: true };
  return { used: used + 1, wouldExceed: false };
}

/**
 * Apply one refund. Never goes below 0. Pure: no side effects.
 */
export function applyRefund(used: number): number {
  return Math.max(0, used - 1);
}

/**
 * Find the count for a user on a given day from an entry list. Pure lookup.
 */
export function findUsage(
  entries: UsageEntry[],
  userId: string,
  day: string
): number {
  return entries.find((e) => e.userId === userId && e.day === day)?.count ?? 0;
}

/**
 * Merge (upsert) a usage value into an entry list for a user+day. Pure: returns
 * a new array, never mutates the input.
 */
export function mergeUsage(
  entries: UsageEntry[],
  entry: Pick<UsageEntry, "userId" | "day"> & { count: number }
): UsageEntry[] {
  const idx = entries.findIndex(
    (e) => e.userId === entry.userId && e.day === entry.day
  );
  if (idx === -1) return [...entries, entry];
  const next = entries.slice();
  next[idx] = { ...next[idx], count: entry.count };
  return next;
}

/**
 * Drop entries whose day is not `today`. Pure: returns a new array.
 * Used by the JSON adapter to keep the file small.
 */
export function dropStaleDays(entries: UsageEntry[], day: string): UsageEntry[] {
  return entries.filter((e) => e.day === day);
}
