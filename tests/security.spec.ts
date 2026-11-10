/**
 * Security smoke tests: CSRF protection and rate limiting
 *
 * Run: npx playwright test --config=playwright.config.ts
 * (uses the default config that boots `npm run dev` on 127.0.0.1:3000)
 */

import { test, expect } from "@playwright/test";

const LOGIN = "/api/auth/login";
const FORGOT = "/api/auth/forgot-password";

test.describe("CSRF Protection", () => {
  test("POST /api/auth/login rejects cross-origin (evil.com)", async ({ request }) => {
    const res = await request.post(LOGIN, {
      headers: {
        Origin: "https://evil.com",
        "Content-Type": "application/json",
      },
      data: { email: "test@example.com", password: "password123" },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(403);
  });

  test("POST /api/auth/login rejects requests with missing Origin", async ({ request }) => {
    const res = await request.post(LOGIN, {
      headers: { "Content-Type": "application/json" },
      data: { email: "test@example.com", password: "password123" },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(403);
  });

  test("POST /api/auth/forgot-password rejects cross-origin", async ({ request }) => {
    const res = await request.post(FORGOT, {
      headers: {
        Origin: "https://evil.example.net",
        "Content-Type": "application/json",
      },
      data: { email: "test@example.com" },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(403);
  });

  test("POST with correct Origin passes CSRF (not 403)", async ({ request, baseURL }) => {
    const res = await request.post(LOGIN, {
      headers: { Origin: baseURL!, "Content-Type": "application/json" },
      data: { email: "wrong@example.com", password: "wrong" },
      failOnStatusCode: false,
    });
    // CSRF passed — anything but 403. (Auth outcome depends on DB state,
    // which is out of scope for this CSRF test.)
    expect(res.status()).not.toBe(403);
    expect(res.status()).not.toBe(429);
  });
});

test.describe("Rate Limiting", () => {
  test("login blocks the 6th request within the 10-minute window", async ({ request, baseURL }) => {
    const email = `ratelimit-${Date.now()}@example.com`;

    // 5 requests pass the rate limiter. Auth outcome (401/500 on bad
    // credentials) is irrelevant — we only assert they were NOT rate-limited.
    for (let i = 0; i < 5; i++) {
      const res = await request.post(LOGIN, {
        headers: { Origin: baseURL! },
        data: { email, password: "wrong" },
        failOnStatusCode: false,
      });
      expect(res.status(), `attempt ${i + 1} should not be rate-limited`).not.toBe(429);
    }

    // 6th request → 429 with retry-after.
    const sixth = await request.post(LOGIN, {
      headers: { Origin: baseURL! },
      data: { email, password: "wrong" },
      failOnStatusCode: false,
    });
    expect(sixth.status()).toBe(429);
    const body = await sixth.json();
    expect(body.error).toBeTruthy();
    expect(sixth.headers()["retry-after"]).toBeTruthy();
  });

  test("login and forgot-password use separate rate limit buckets", async ({ request, baseURL }) => {
    const ts = Date.now();

    // Exhaust the login bucket for this unique email (5 attempts).
    for (let i = 0; i < 5; i++) {
      await request.post(LOGIN, {
        headers: { Origin: baseURL! },
        data: { email: `bucket-${ts}@example.com`, password: "wrong" },
        failOnStatusCode: false,
      });
    }
    const blocked = await request.post(LOGIN, {
      headers: { Origin: baseURL! },
      data: { email: `bucket-${ts}@example.com`, password: "wrong" },
      failOnStatusCode: false,
    });
    expect(blocked.status()).toBe(429);

    // A distinct email is a distinct bucket — not 429.
    const otherEmail = await request.post(LOGIN, {
      headers: { Origin: baseURL! },
      data: { email: `other-${ts}@example.com`, password: "wrong" },
      failOnStatusCode: false,
    });
    expect(otherEmail.status()).not.toBe(429);

    // forgot-password policy (different bucket) is not exhausted either.
    const forgot = await request.post(FORGOT, {
      headers: { Origin: baseURL! },
      data: { email: `forgot-${ts}@example.com` },
      failOnStatusCode: false,
    });
    expect(forgot.status()).not.toBe(429);
  });
});
