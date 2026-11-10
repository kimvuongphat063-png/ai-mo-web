/**
 * Server-runtime integration tests for the JSON/PG usage adapters.
 *
 * Why a separate file: the JSON and PG adapters both `import "server-only"`.
 * That package resolves to a throwing stub unless the `react-server` export
 * condition is active, which is exactly what plain `tsx tests/unit.ts` lacks.
 * We keep `npm test` fast and pure-only (covers the `quota-core` math).
 *
 * This file runs under `npm run test:server`, which is:
 *   node --conditions=react-server --import tsx tests/server/usage-adapter.ts
 *
 * The `--conditions=react-server` flag makes Node resolve `server-only` to its
 * `empty.js` export — the same resolution Next.js uses for Server Components.
 * No mock, no alias, no module shim: the real `import "server-only"` statement
 * stays in `json-usage.ts` and `pg-usage.ts` and is honored here.
 *
 * What it covers:
 *   - JSON adapter consume/refund/per-user isolation via quota-core
 *   - Dispatcher routes to JSON when STUDIO_STORAGE !== "postgres"
 *   - Dispatcher routes to Postgres when STUDIO_STORAGE === "postgres"
 *     (routing assertion only — no connection is opened)
 *   - Optional live PG round-trip, skipped unless DATABASE_URL_FOR_TEST is set
 *     (never reads DATABASE_URL, so staging/production are never touched)
 */
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

let passed = 0;
let failed = 0;
const failures: string[] = [];

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
    failures.push(`${name}\n${message}`);
    console.log(`  ✗ ${name}`);
  }
}

function section(name: string) {
  console.log(`\n${name}`);
}

function setEnv(values: Record<string, string | undefined>) {
  for (const key of [
    "AI_PROVIDER",
    "AI_MODEL",
    "AI_TIMEOUT_MS",
    "AI_MAX_RETRIES",
    "AI_DAILY_LIMIT",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "GEMINI_API_KEY",
    "STUDIO_STORAGE",
    "DATABASE_URL",
  ]) {
    delete process.env[key];
  }
  Object.assign(process.env, values);
}

async function main() {
  // Isolated cwd so the JSON adapter writes to a throwaway data/ folder.
  const workdir = await mkdtemp(path.join(tmpdir(), "aimo-server-"));
  const originalCwd = process.cwd();
  process.chdir(workdir);

  // Reset module cache between scenarios so env-driven adapter pick is fresh.
  const freshImport = async () => {
    const { consumeQuota, getUsage, refundQuota } = await import(
      "@/lib/ai/usage"
    );
    const { AiError } = await import("@/lib/ai/errors");
    return { consumeQuota, getUsage, refundQuota, AiError };
  };

  section("usage adapter — JSON");

  await test("consumeQuota decrements the remaining allowance", async () => {
    setEnv({ AI_DAILY_LIMIT: "3" });
    const { resetAiEnvCache } = await import("@/lib/ai/env");
    resetAiEnvCache();
    const { consumeQuota } = await freshImport();
    const first = await consumeQuota("user-a");
    assert.equal(first.used, 1);
    assert.equal(first.remaining, 2);
    const second = await consumeQuota("user-a");
    assert.equal(second.used, 2);
    assert.equal(second.remaining, 1);
  });

  await test("quota is tracked per user", async () => {
    const { getUsage } = await freshImport();
    const other = await getUsage("user-b");
    assert.equal(other.used, 0);
    assert.equal(other.remaining, 3);
  });

  await test("consumeQuota throws AiError('quota') once exhausted", async () => {
    const { consumeQuota, AiError } = await freshImport();
    await consumeQuota("user-a"); // 3rd of 3
    await assert.rejects(
      () => consumeQuota("user-a"),
      (err: unknown) => err instanceof AiError && err.code === "quota"
    );
  });

  await test("refundQuota restores one reservation", async () => {
    const { refundQuota, getUsage } = await freshImport();
    await refundQuota("user-a");
    const status = await getUsage("user-a");
    assert.equal(status.used, 2);
    assert.equal(status.remaining, 1);
  });

  section("usage adapter — dispatcher routing (no DB)");

  await test("routes to JSON when STUDIO_STORAGE is unset", async () => {
    setEnv({});
    const { activeUsageBackend } = await import("@/lib/ai/usage");
    assert.equal(activeUsageBackend(), "json");
  });

  await test("routes to Postgres when STUDIO_STORAGE=postgres", async () => {
    setEnv({ STUDIO_STORAGE: "postgres" });
    const { activeUsageBackend } = await import("@/lib/ai/usage");
    assert.equal(activeUsageBackend(), "postgres");
  });

  await test("routes back to JSON for any non-postgres value", async () => {
    setEnv({ STUDIO_STORAGE: "json" });
    const { activeUsageBackend } = await import("@/lib/ai/usage");
    assert.equal(activeUsageBackend(), "json");
  });

  section("usage adapter — Postgres (optional, skipped if no DATABASE_URL)");

  if (!process.env.DATABASE_URL_FOR_TEST) {
    console.log("  ⊘ skipped (set DATABASE_URL_FOR_TEST to enable)");
  } else {
    setEnv({ AI_DAILY_LIMIT: "3", DATABASE_URL: process.env.DATABASE_URL_FOR_TEST });
    const { resetAiEnvCache } = await import("@/lib/ai/env");
    resetAiEnvCache();
    const { consumeQuota, getUsage, refundQuota, AiError } = await freshImport();
    const first = await consumeQuota("pg-user");
    assert.equal(first.used, 1);
    await refundQuota("pg-user");
    const after = await getUsage("pg-user");
    assert.equal(after.used, 0);
    // Exhaust path
    await consumeQuota("pg-user");
    await consumeQuota("pg-user");
    await assert.rejects(
      () => consumeQuota("pg-user"),
      (err: unknown) => err instanceof AiError && err.code === "quota"
    );
  }

  process.chdir(originalCwd);
  await rm(workdir, { recursive: true, force: true });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    for (const failure of failures) console.error(`\n${failure}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
