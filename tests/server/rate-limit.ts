/**
 * Rate limit — real module tests under the `react-server` Node condition.
 *
 * Run: node --conditions=react-server --import tsx tests/server/rate-limit.ts
 *
 * This resolves `server-only` to its empty stub exactly like Next.js does for
 * Server Components, so the REAL src/lib/rate-limit-v2.ts is exercised —
 * not a copy of its constants.
 */

// NODE_ENV is read-only in @types/node; test env juggling requires a cast.
/* eslint-disable @typescript-eslint/no-explicit-any */

import assert from "node:assert/strict";
import {
  POLICIES,
  checkRateLimit,
  validateRateLimitConfig,
} from "../../src/lib/rate-limit-v2";

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

const savedEnv = { ...process.env };

function resetTestEnv() {
  // Keep NODE_ENV as the harness set it, clear Upstash so the in-memory
  // fallback path runs deterministically in tests.
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
}

async function main() {
  resetTestEnv();

  section("policy definitions (real module)");

  await test("login: 5 requests / 10 minutes, prefix rl:login", () => {
    assert.equal(POLICIES.login.limit, 5);
    assert.equal(POLICIES.login.windowMs, 10 * 60 * 1000);
    assert.equal(POLICIES.login.prefix, "rl:login");
  });

  await test("register: 3 requests / 10 minutes, prefix rl:register", () => {
    assert.equal(POLICIES.register.limit, 3);
    assert.equal(POLICIES.register.windowMs, 10 * 60 * 1000);
    assert.equal(POLICIES.register.prefix, "rl:register");
  });

  await test("forgot: 3 requests / 30 minutes, prefix rl:forgot", () => {
    assert.equal(POLICIES.forgot.limit, 3);
    assert.equal(POLICIES.forgot.windowMs, 30 * 60 * 1000);
    assert.equal(POLICIES.forgot.prefix, "rl:forgot");
  });

  await test("reset: 5 requests / 30 minutes, prefix rl:reset", () => {
    assert.equal(POLICIES.reset.limit, 5);
    assert.equal(POLICIES.reset.windowMs, 30 * 60 * 1000);
    assert.equal(POLICIES.reset.prefix, "rl:reset");
  });

  await test("aiGenerate: 30 requests / 24 hours, prefix rl:ai", () => {
    assert.equal(POLICIES.aiGenerate.limit, 30);
    assert.equal(POLICIES.aiGenerate.windowMs, 24 * 60 * 60 * 1000);
    assert.equal(POLICIES.aiGenerate.prefix, "rl:ai");
  });

  await test("window string matches windowMs for every policy", () => {
    // `window` is what the Upstash limiter is actually constructed with —
    // it must encode the same duration as windowMs or Upstash and the
    // in-memory fallback would disagree.
    const units: Record<string, number> = { m: 60_000, h: 3_600_000, d: 86_400_000 };
    for (const [name, p] of Object.entries(POLICIES)) {
      const match = p.window.match(/^(\d+)\s*([mhd])$/);
      assert.ok(match, `policy ${name} window "${p.window}" must be "<n> m|h|d"`);
      const ms = Number(match[1]) * units[match[2]];
      assert.equal(ms, p.windowMs, `policy ${name}: window "${p.window}" != windowMs`);
    }
  });

  await test("every policy has a distinct prefix", () => {
    const prefixes = Object.values(POLICIES).map((p) => p.prefix);
    assert.equal(new Set(prefixes).size, prefixes.length);
  });

  section("in-memory window behavior (real module, dev fallback)");

  await test("login blocks the 6th request inside a 10-minute window", async () => {
    const key = `test-login-${Date.now()}`;
    for (let i = 1; i <= 5; i++) {
      const r = await checkRateLimit("login", key);
      assert.equal(r.allowed, true, `request ${i} must be allowed`);
    }
    const sixth = await checkRateLimit("login", key);
    assert.equal(sixth.allowed, false, "6th request must be blocked");
    assert.ok(sixth.resetMs > Date.now(), "resetMs must be in the future");
    // Window is 10 minutes — retry window should be substantial, not ~1s.
    const retryWindowMs = sixth.resetMs - Date.now();
    assert.ok(
      retryWindowMs > 9 * 60 * 1000,
      `retry window should be ~10 minutes, got ${(retryWindowMs / 60000).toFixed(1)} min`,
    );
  });

  await test("policies do not share buckets (login exhausted, register intact)", async () => {
    const key = `test-iso-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      await checkRateLimit("login", key);
    }
    const loginBlocked = await checkRateLimit("login", key);
    assert.equal(loginBlocked.allowed, false);

    const registerOk = await checkRateLimit("register", key);
    assert.equal(registerOk.allowed, true, "register bucket must be independent");
  });

  await test("distinct identifiers have independent buckets", async () => {
    const a = `test-a-${Date.now()}`;
    const b = `test-b-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      await checkRateLimit("login", a);
    }
    const aBlocked = await checkRateLimit("login", a);
    assert.equal(aBlocked.allowed, false);
    const bOk = await checkRateLimit("login", b);
    assert.equal(bOk.allowed, true);
  });

  await test("register policy enforces its own limit of 3", async () => {
    const key = `test-reg-${Date.now()}`;
    for (let i = 1; i <= 3; i++) {
      const r = await checkRateLimit("register", key);
      assert.equal(r.allowed, true, `request ${i} must be allowed`);
    }
    const fourth = await checkRateLimit("register", key);
    assert.equal(fourth.allowed, false, "4th register request must be blocked");
  });

  section("production configuration gate (real module)");

  await test("validateRateLimitConfig: production without Upstash fails", () => {
    (process.env as any).NODE_ENV = "production";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    try {
      const result = validateRateLimitConfig();
      assert.equal(result.ok, false);
      assert.match(result.error ?? "", /UPSTASH_REDIS_REST_URL/);
    } finally {
      (process.env as any).NODE_ENV = savedEnv.NODE_ENV ?? "test";
    }
  });

  await test("checkRateLimit: production without Upstash throws (fail closed)", async () => {
    (process.env as any).NODE_ENV = "production";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    try {
      await assert.rejects(
        () => checkRateLimit("login", `prod-${Date.now()}`),
        (err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          return /required in production/.test(msg);
        },
      );
    } finally {
      (process.env as any).NODE_ENV = savedEnv.NODE_ENV ?? "test";
    }
  });

  await test("validateRateLimitConfig: production with Upstash configured passes", () => {
    (process.env as any).NODE_ENV = "production";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "dummy";
    try {
      const result = validateRateLimitConfig();
      assert.equal(result.ok, true);
    } finally {
      (process.env as any).NODE_ENV = savedEnv.NODE_ENV ?? "test";
      resetTestEnv();
    }
  });

  await test("validateRateLimitConfig: dev without Upstash is ok (warns only)", () => {
    (process.env as any).NODE_ENV = "development";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    try {
      const result = validateRateLimitConfig();
      assert.equal(result.ok, true);
    } finally {
      (process.env as any).NODE_ENV = savedEnv.NODE_ENV ?? "test";
    }
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    for (const failure of failures) console.error(`\n${failure}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
