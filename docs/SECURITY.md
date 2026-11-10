# Security Model — AI MỞ

**Phase 5A.1 closeout:** policies, runtime behavior, and required environment.

## 1. Session & Authentication

- Session cookie `aimo_demo_session`: 8-hour sliding TTL, 7-day absolute TTL,
  HMAC-SHA-256 signed with `AUTH_SECRET` (timing-safe comparison).
- Session payload carries a `passwordVersion` (`v`); password change/reset
  bumps it in the DB and invalidates all prior sessions (stateless revocation).
- Passwords are hashed with Argon2id (m=19456 KiB, t=2, p=1, 32-byte output).
- Login attempts: 5 per 10 minutes per IP + SHA-256 email hash — a different
  email does not unlock a blocked IP and vice versa.
- Demo fallback hashes (no `DATABASE_URL`) exist for local development only.

### AUTH_SECRET gate

`AUTH_SECRET` is validated at server startup (`src/instrumentation.ts` →
`getSecret()` in `src/lib/auth-shared.ts`):

- **Production:** missing secret, the checked-in fallback secret, or a secret
  shorter than 32 chars **fails the boot** — the process exits instead of
  serving requests with a weak key.
- **Development:** falls back to the demo secret with a console warning.

## 2. CSRF Protection

All cookie-authenticated mutation routes (`POST/PUT/PATCH/DELETE`) are guarded
by Origin/Referer validation (`src/lib/csrf.ts` via `authorizeMutation()` in
`src/lib/auth-csrf.ts`):

- `Origin` (preferred) or `Referer` must match the request `Host` or an entry
  in `ALLOWED_ORIGINS` (comma-separated URLs).
- Requests with neither header are rejected (403) — scripted clients must set
  `Origin` explicitly, which is what the Playwright request context does.
- Non-mutation methods (GET/HEAD/OPTIONS) are exempt.

**Coverage:** all 21 mutation handlers across `/api/auth/*`, `/api/admin/cms/*`,
`/api/checkout`, `/api/creator/products`, `/api/newsletter`, `/api/progress`,
and every `/api/studio/*` write route (products, scripts, campaigns, campaign
days, performance, brand, analyze).

> Note: same-origin defense combines with `SameSite=Lax` cookies. Browser
> requests that pass the Origin check are accepted; a per-request token layer
> (double-submit) was evaluated and deferred — Origin validation is the OWASP
> recommended primary control for this cookie model.

## 3. Rate Limiting

`src/lib/rate-limit-v2.ts` — per-policy limiters, each with its own Redis
prefix and window. Verified by `tests/server/rate-limit.ts` (15 tests) and
`tests/security.spec.ts` (6 Playwright tests).

| Policy | Limit | Window | Key | Redis prefix |
|---|---|---|---|---|
| login | 5 | 10 minutes | IP + email hash | `rl:login` |
| register | 3 | 10 minutes | IP | `rl:register` |
| forgot-password | 3 | 30 minutes | IP + email hash | `rl:forgot` |
| reset-password | 5 | 30 minutes | IP | `rl:reset` |
| AI generation | 30 | 24 hours | userId (quota plan) | `rl:ai` |

- Each Upstash limiter is constructed with `Ratelimit.slidingWindow(limit, window)`
  at init — per-policy windows are enforced by the limiter itself, not passed
  per-call (the old code's per-call `period` was silently ignored and every
  bucket actually ran on a 1-second window).
- Buckets are isolated by policy prefix and by identifier — exhausting login
  for one email does not affect register, forgot-password, or another email.
- **Fail closed in production:** without `UPSTASH_REDIS_REST_URL` /
  `UPSTASH_REDIS_REST_TOKEN`, `checkRateLimit()` throws and the startup
  instrumentation gate fails the boot. Development falls back to an in-memory
  sliding window (single-process only) with a console warning.

### No-logging rule

Rate-limit keys hash the email (SHA-256, first 16 hex chars) before use;
identifiers, tokens, passwords, database URLs, and secrets are never logged.
Log lines carry only the policy name and the error class.

## 4. Required Production Environment

Validated at startup (`src/instrumentation.ts`); each missing item fails the
production boot with a numbered error:

| Variable | Requirement |
|---|---|
| `AUTH_SECRET` | Required, ≥ 32 chars, must not be the demo fallback |
| `UPSTASH_REDIS_REST_URL` | Required in production (rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | Required in production (rate limiting) |
| `DATABASE_URL` | Required for real auth; absent → demo-hash auth |
| `APP_URL` / `ALLOWED_ORIGINS` | Optional; extend CSRF allow-list for proxies |

Generate a secret: `openssl rand -hex 32`.

## 5. Secret Exposure Audit (2026-10-04)

- The workspace is **not a git repository** — `.env.local` (which contains the
  Supabase `DATABASE_URL` password) has never been committed to any history.
- `.gitignore` covers `.env*`, `/data/` (JSON stores + learner progress),
  `/backups/` (Postgres restore points), and `*.log`.
- **Action for first `git init`/push:** verify `git status` shows no `.env*`,
  `data/`, or `backups/` entries before the initial commit. Rotation of the
  Supabase password is recommended **before** the repo ever leaves this
  machine, but no committed-history exposure exists today.

## 6. Known Gaps (accepted, tracked)

- `aiGenerate` rate limiting currently lives in the quota system (30/day,
  enforced in `src/lib/ai`); the `rl:ai` Upstash policy mirrors it for
  network-level defense.
- Supabase staging DB is currently unreachable (tenant paused) — schema drift
  (`User.passwordHash` missing) blocks the DB auth path until
  `npx prisma db push` is run; demo-hash fallback covers local dev.
- Account lockout and audit logging remain future work (documented in
  README).
