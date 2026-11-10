# Lint Baseline

**Snapshot date:** 2026-08-30 (Phase 4C)

`npm run lint` reports **77 problems: 58 errors, 19 warnings**.

All 77 are **pre-existing baseline** — the files added in Phase 4C
(`scripts/pg-acceptance.ts`, `scripts/pg-backup-restorepoint.ts`) are lint-clean
(`npx eslint <file>` → 0 problems). No new lint errors were introduced in
Phase 4C. Cleaning the baseline is out of scope for Phase 4C per the stable
lint gate; the plan below assigns the cleanup to future phases.

## Problem groups

| Group | Rule | Errors | Warnings | Files |
|---|---|---|---|---|
| 1. `any` at Prisma boundary | `@typescript-eslint/no-explicit-any` | ~50 | – | `src/lib/studio-storage/postgres.ts` (14), `src/app/api/studio/admin/health/route.ts` (2), `src/lib/ai/pg-usage.ts` (4), `scripts/verify-studio-pg.ts` (16), `scripts/migrate-studio-to-pg.ts` (11), `scripts/_pg-check.ts`, `_pg-check2.ts`, `_pg-check3.ts` |
| 2. `any` in Playwright specs | `@typescript-eslint/no-explicit-any` | 3 | – | `tests/postgres-smoke.spec.ts` (3) |
| 3. Unused imports / vars | `@typescript-eslint/no-unused-vars` | – | ~19 | `src/lib/studio.ts` (6 imports), `src/lib/validation/studio.ts`, `src/lib/studio-storage/postgres.ts` (`CampaignItem`), `src/app/api/studio/{brand,campaigns,products,scripts,performance}/route.ts` (`req`), `src/app/app/scripts/new/page.tsx` (`Link`), `scripts/migrate-studio-to-pg.ts` |
| 4. Literal type assertions | `@typescript-eslint/prefer-as-const` | 3 | – | `scripts/seed-studio-data.ts` (3) |

## Fix plan by phase (out of scope for 4C)

1. **Phase 4D (typed Prisma adapter):** replace the `any`-typed Prisma boundary
   with the generated client types. This clears group 1 (→ `src/lib/studio-storage/postgres.ts`,
   `src/lib/ai/pg-usage.ts`, `src/app/api/studio/admin/health/route.ts`).
   Same change applied to the scripts removes the remaining `scripts/*` entries.
2. **Phase 4D (test typing):** if `postgres-smoke.spec.ts` is retained, type the
   callback params (`(p: { name: string })`) — clears group 2.
3. **Phase 4E (dead-code sweep):** drop unused imports in `src/lib/studio.ts`
   (leftovers from the JSON-file implementation) and unused `req` params —
   clears group 3.
4. **Phase 4E (style fix):** apply `as const` to the three literal assertions in
   `scripts/seed-studio-data.ts` — clears group 4. 3 of these are auto-fixable
   (`eslint --fix`).

## Gate rule (Phase 4C)

New files must be lint-clean: `npx eslint scripts/pg-acceptance.ts scripts/pg-backup-restorepoint.ts`.
The full-suite count may drift only downward, never upward.
