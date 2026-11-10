# AI MỞ — Vietnamese AI learning storefront

Next.js 16.2.3 / React 19 demo storefront with role-separated authentication, editable JSON CMS, learner progress, owned-product cart, and transparent affiliate redirects.

## Demo credentials

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@aimo.vn` | `Admin@2026!` |
| Learner | `hocvien@aimo.vn` | `Hocvien@2026!` |

These are intentionally public **demo-only** credentials. Never reuse them in production.

## Commands

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

Open `http://localhost:3000`. Useful routes: `/`, `/courses`, `/login`, `/account/learning`, `/admin`, and `/learn/ai-thuc-chien-21-ngay/chao-mung`.

## Security model

- `aimo_demo_session` is an 8-hour HMAC-SHA-256 signed, HTTP-only, SameSite=Lax cookie. It is Secure in production. Payload signatures and credentials use timing-safe comparison.
- Set a high-entropy `AUTH_SECRET` in every non-demo deployment. The checked-in fallback exists only for zero-configuration local demonstration.
- Admin and learner identities/roles are distinct. Server layouts guard every page under `/admin`, `/account`, and `/learn`. Mutation APIs authenticate before validation and return 401 when signed out or 403 for the wrong role.
- Progress identity comes only from the verified cookie. Clients cannot select a user ID or progress file.
- CMS data is parsed by Zod on every read/write. Writes use a same-directory temporary file followed by atomic rename. Slugs, lengths, price ranges, colors, durations, duplicate slugs, and YouTube input are constrained.
- Only validated 11-character YouTube IDs from direct IDs, `youtube.com`, or `youtu.be` become `youtube-nocookie.com` embeds. Missing videos render an accessible fallback.
- This demo has no CSRF token service. SameSite=Lax limits cross-site cookie submission, but a production system must add origin/CSRF checks, rate limiting, password hashing, account lockout, audit logs, and a durable identity provider.

## Persistence and deployment

`data/cms.json` is the CMS source of truth. Learner progress is stored under `data/progress/<server-derived-user-id>.json`. Both require a writable, persistent filesystem and are suitable for a single Node process/demo. Serverless or multi-instance deployment requires transactional shared storage (database/object store with concurrency control); do not depend on ephemeral filesystems.

Run behind HTTPS and a reverse proxy, set `AUTH_SECRET`, restrict filesystem permissions, back up `data/`, and use one writer process. The optimized server is built with `npm run build` and launched with `npm start -- -H 127.0.0.1 -p 3000`.

## Preserved product behavior

- Owned products retain the `aimo-cart` localStorage cart and demo checkout.
- Affiliate products never enter the internal cart. External CTAs continue through `/api/affiliate/click?slug=...`; server-side product allowlisting and 302 redirect behavior remain intact, along with initiating-link sponsored/noopener disclosure behavior.

## CMS v2

`data/cms.json` contains the eight original storefront products plus paths and articles. Products are discriminated as course, desktop, webapp, affiliate, bundle, or resource; courses own nested modules and lessons. IDs and slugs are unique across products, paths, and articles, and path references must resolve.

Administrators use `/admin/content/products`, `/admin/content/courses`, `/admin/content/paths`, `/admin/content/tools`, `/admin/content/affiliates`, `/admin/content/bundles`, `/admin/content/resources`, and `/admin/content/articles`. Entity APIs are `GET/POST /api/admin/cms/:type` and `PUT/DELETE /api/admin/cms/:type/:id`. They require the admin role, validate with Zod, serialize mutations through one queue, and atomically rename temporary files. Legacy whole-document GET/PUT remains available for compatibility.

Public catalogs and details read published CMS entities. The server adapter converts CMS products to the serializable storefront shape consumed by client cart components. Cart snapshots continue to resolve the original eight products client-side; checkout always accepts slugs rather than trusting client prices.
