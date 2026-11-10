# Studio Database Migration Plan (Phase 4)

## Objective
Safely and reversibly migrate AI Mở Studio from flat JSON file storage (`data/studio.json`, `data/ai-usage.json`) to Supabase PostgreSQL, leveraging Prisma. 
This document defines the transition mapping, constraints, migration order, and rollback strategies.

## Entity Mapping & Proposed Relational Schema

### 1. Product (`StudioProduct`)
- **PK**: `id` (String, `cuid()`)
- **JSON Fields**: `name`, `url`, `description`, `priceOffer`, `featuresText`, `targetCustomer`, `problemSolved`, `allowedProof`, `claimsToAvoid`, `affiliateLink`, `brandVoice`.
- **Cache**: `analysisCache` (JSON), `analysisFingerprint` (String).
- **Constraints**: 
  - `userId` (String) with index `@@index([userId])`. 
  - Soft delete: `deletedAt` (DateTime?).

### 2. Brand Memory (`StudioBrandProfile`)
- **PK**: `userId` (String @id) - One profile per user.
- **Fields**: `companyName`, `brandVoice`, `prohibitedClaims`, `requiredDisclosures`, `preferredFormats` (String[]), `targetAudience`, `competitorUrls` (String[]), `language`.

### 3. Script (`StudioScript`)
- **PK**: `id` (String, `cuid()`)
- **FK**: `productProfileId` -> `StudioProduct(id)` (OnDelete: Cascade).
- **Fields**: `platform`, `goal`, `durationSeconds`, `selectedAngleId`, `missingInformation` (String[]), `complianceNotes` (String[]).
- **Nested Scripts/Shots**: Instead of splitting into `StudioScriptVariant` and `StudioShot`, due to the deeply nested AI-generated structure and tight transactional nature, the `scripts` array will be stored as a `JSON` column. 
- **Constraints**: `@@index([userId])`, soft delete: `deletedAt`.

### 4. Campaign (`StudioCampaign`)
- **PK**: `id` (String, `cuid()`)
- **Fields**: `name`, `startDate`, `durationDays`, `platform`, `goal`.
- **Constraints**: `@@index([userId])`, soft delete: `deletedAt`.

### 5. Campaign Day/Item (`StudioCampaignItem`)
- **PK**: Composite `@@id([campaignId, day])` or unique `id` (cuid()). Let's use `id` (String, `cuid()`).
- **FK**: `campaignId` -> `StudioCampaign(id)` (OnDelete: Cascade).
- **FK**: `scriptId` -> `StudioScript(id)` (Optional, OnDelete: SetNull).
- **Fields**: `day` (Int), `status`, `publishedUrl`, `notes`.
- **Constraints**: `@@unique([campaignId, day])`.

### 6. Performance Metric (`StudioPerformanceMetric`)
- **PK**: `id` (String, `cuid()`)
- **FK**: `scriptId` -> `StudioScript(id)` (OnDelete: Cascade).
- **FK**: `campaignId` -> `StudioCampaign(id)` (Optional, OnDelete: SetNull).
- **Fields**: `recordedAt`, `views`, `likes`, `comments`, `shares`, `clicks`, `conversions`, `revenue`, `costSpent`, `watchTimeSeconds`, `engagementRate`, `ctr`, `roas`.
- **Constraints**: `@@index([userId])`.

### 7. AI Usage / Quota (`StudioAiUsage`)
- **PK**: `id` (String, `cuid()`)
- **Fields**: `userId` (String), `day` (String, YYYY-MM-DD), `count` (Int).
- **Constraints**: `@@unique([userId, day])`.

### 8. Generation Job (`StudioGenerationJob`) (Future)
- **PK**: `id` (String, `cuid()`)
- **Fields**: `userId`, `status` (pending, running, complete, failed), `prompt`, `result` (JSON).

## Foreign Keys & Ownership Constraints
- Because the existing storefront uses a `User` table with `cuid()` and Studio uses custom demo string IDs (`"admin-demo"`), **no strict foreign key** will be made to `User(id)` for now. 
- `userId` will simply be a `String` field indexed in Postgres to ensure fast queries.

## Migration Order
1. Parse `data/studio.json` & `data/ai-usage.json`.
2. Insert `StudioBrandProfile` and `StudioAiUsage`.
3. Insert `StudioProduct`.
4. Insert `StudioScript` (Requires `StudioProduct`).
5. Insert `StudioCampaign`.
6. Insert `StudioCampaignItem` (Requires `StudioCampaign` and `StudioScript`).
7. Insert `StudioPerformanceMetric`.

## Rollback Plan
- The JSON files (`data/studio.json`, `data/ai-usage.json`) will NOT be deleted. 
- If Postgres fails, rolling back simply means flipping the env variable (e.g. `STUDIO_DB_MODE=json`) which will instantly reconnect the JSON store handlers.

## Compatibility & Retention
- **Soft Delete Policy**: Implemented via `deletedAt` for products, scripts, and campaigns to allow recovery.
- **Backup/Export**: Use `pg_dump` or Supabase backups. Exports remain possible by querying all rows for a given `userId`.

---
## Local Setup Guide (Postgres / Supabase)
1. Provide `DATABASE_URL` in `.env.local`:
   ```bash
   # .env.local
   # Example: Postgres connection string (Do not commit real passwords)
   DATABASE_URL="postgresql://postgres:password@localhost:5432/aimo?schema=public"
   ```
2. Apply changes via Prisma:
   ```bash
   npx prisma db push
   # OR
   npx prisma migrate dev --name init_studio
   ```
3. Generate client:
   ```bash
   npx prisma generate
   ```
