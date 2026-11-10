/**
 * Test-fixture naming policy — single source of truth.
 *
 * Every automated fixture that writes to the staging Postgres database MUST
 * use one of these prefixes so that (a) a failed run can never be mistaken for
 * another run's data, and (b) audit/cleanup tooling can enumerate leftovers
 * deterministically.
 *
 * Prefixes are allowed to start with different words but are matched by
 * `startsWith`, so choose distinctive stems and avoid one prefix being a
 * prefix of another (e.g. keep `staging-smoke-` and `staging-cascade-`
 * distinct from a bare `staging-`).
 *
 * Never add real/brand lifecycle data under these prefixes.
 */

export const TEST_PREFIXES = [
  "acc-",           // Phase 4C acceptance harness (scripts/pg-acceptance.ts)
  "staging-smoke-", // Playwright postgres staging smoke (tests/staging-smoke.spec.ts)
  "staging-cascade-", // Playwright cascade integration fixture
  "smoke-",         // legacy Playwright smoke fixtures (historical rows)
] as const;

/** True when `name` starts with any registered test-fixture prefix. */
export function isTestFixtureName(name: string): boolean {
  return TEST_PREFIXES.some((p) => name.startsWith(p));
}
