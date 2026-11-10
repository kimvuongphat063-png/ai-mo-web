import "server-only";

/**
 * Studio delete cascade / detach policy — single source of truth.
 *
 * Both storage adapters (`json.ts`, `postgres.ts`) implement this policy so the
 * two backends cannot drift. The rules mirror the declared intent in
 * `prisma/schema.prisma`, which the Postgres adapter could not enforce on its
 * own because it deletes via `deletedAt` (soft-delete) — a soft-delete never
 * fires the database-level `onDelete` triggers, which is exactly how orphan
 * campaign items and dangling metrics were produced.
 *
 * The executable transformation lives in `delete-cascade.ts` (dependency-free)
 * and is shared by the adapters and the regression tests.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Policy
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * delete Script:
 *   - Campaign items referencing it       → DETACH  (scriptId = null, status = "planned")
 *   - Performance metrics referencing it  → CASCADE (deleted)
 *
 *   A campaign item is a *day slot* in a schedule. The day still exists after
 *   its script is removed, so the slot must survive with no script attached.
 *   `"planned"` is the existing domain value for "day exists, nothing scripted
 *   yet" — it is the schema's spelling of "unscheduled"; no enum change needed.
 *   A performance metric, by contrast, has no meaning without the script whose
 *   performance it records, so it is removed with the script
 *   (`schema.prisma`: `script … onDelete: Cascade`).
 *
 * delete Product:
 *   - Scripts referencing it              → CASCADE (deleted, applying the Script rules above)
 *
 *   `schema.prisma`: `product … onDelete: Cascade`.
 *
 * delete Campaign:
 *   - Campaign items belonging to it      → CASCADE (deleted — they are children of the campaign)
 *   - Performance metrics referencing it  → DETACH  (campaignId = null, metric survives)
 *
 *   `schema.prisma`: item `campaign … onDelete: Cascade`,
 *   metric `campaign … onDelete: SetNull`. A metric records a script's
 *   performance; losing the campaign grouping must not lose the measurement.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Invariant
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * After any delete, no live record may reference a deleted or soft-deleted
 * record. Concretely, for every campaign item with a non-null `scriptId` the
 * referenced script must exist and be live; likewise for every performance
 * metric's `scriptId`, and for every non-null `campaignId`.
 */

/** Status a campaign item falls back to when its script is detached. */
export { UNSCHEDULED_STATUS } from "./delete-cascade";
