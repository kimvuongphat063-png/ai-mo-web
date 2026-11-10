#!/usr/bin/env tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Staging Environment Audit Script (Phase 5A)
 * 
 * Safely audits all production/staging configuration without leaking secrets.
 * Run: npx tsx scripts/audit-staging-env.ts
 */

import path from "node:path";
import * as dotenv from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function auditEnvironment() {
  console.log("==========================================================");
  console.log("     PROMPTKICHBAN STAGING ENVIRONMENT AUDIT (PHASE 5A)   ");
  console.log("==========================================================\n");

  const results: Record<string, string> = {};

  // 1. APP_URL
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  results["APP_URL"] = appUrl ? `CONFIGURED (${appUrl})` : "MISSING (defaults to localhost:3000)";

  // 2. AUTH_SECRET
  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    results["AUTH_SECRET"] = "MISSING (Production gate will fail-closed)";
  } else if (authSecret.length < 32) {
    results["AUTH_SECRET"] = `CONFIGURED BUT WEAK (Length: ${authSecret.length} < 32)`;
  } else if (authSecret.includes("demo-auth-secret")) {
    results["AUTH_SECRET"] = "CONFIGURED (Using demo placeholder - reject in production)";
  } else {
    results["AUTH_SECRET"] = `CONFIGURED (Strong, length: ${authSecret.length})`;
  }

  // 3. DATABASE_URL & Reachability
  const dbUrl = process.env.DATABASE_URL;
  let dbReachable = false;
  let docCount = 0;
  if (!dbUrl) {
    results["DATABASE_URL"] = "MISSING";
    results["DATABASE_STATUS"] = "UNCONFIGURED";
  } else {
    results["DATABASE_URL"] = `CONFIGURED (Safe host: ${dbUrl.split("@")[1]?.split("/")[0] || "postgres"})`;
    try {
      const adapter = new PrismaPg({ connectionString: dbUrl });
      const prisma = new PrismaClient({ adapter });
      await prisma.$queryRaw`SELECT 1`;
      // Check PromptKichBanDocument count
      const count = await (prisma as any).promptKichBanDocument.count();
      dbReachable = true;
      docCount = count;
      results["DATABASE_STATUS"] = `REACHABLE (PromptKichBanDocument rows: ${docCount})`;
      await prisma.$disconnect();
    } catch (err: unknown) {
      results["DATABASE_STATUS"] = `UNREACHABLE (${err instanceof Error ? err.message : String(err)})`;
    }
  }

  // 4. STUDIO_STORAGE
  const studioStorage = process.env.STUDIO_STORAGE || "json";
  results["STUDIO_STORAGE"] = `CONFIGURED (${studioStorage})`;

  // 5. PROMPTKICHBAN_AI_PROVIDER
  const pkbProvider = process.env.PROMPTKICHBAN_AI_PROVIDER || process.env.AI_PROVIDER || "mock";
  results["PROMPTKICHBAN_AI_PROVIDER"] = pkbProvider;

  // 6. PROMPTKICHBAN_AI_BASE_URL
  const pkbBaseUrl = process.env.PROMPTKICHBAN_AI_BASE_URL;
  results["PROMPTKICHBAN_AI_BASE_URL"] = pkbBaseUrl ? `CONFIGURED (${pkbBaseUrl})` : "DEFAULT (https://api.vietapi.tech/v1)";

  // 7. PROMPTKICHBAN_AI_MODEL
  const pkbModel = process.env.PROMPTKICHBAN_AI_MODEL || process.env.AI_MODEL || "deepseek-v4-flash";
  results["PROMPTKICHBAN_AI_MODEL"] = pkbModel;

  // 8. PROMPTKICHBAN_AI_API_KEY
  const pkbApiKey = process.env.PROMPTKICHBAN_AI_API_KEY || (pkbProvider === "gemini" ? process.env.GEMINI_API_KEY : null);
  results["PROMPTKICHBAN_AI_API_KEY"] = pkbApiKey ? `CONFIGURED (Prefix: ${pkbApiKey.slice(0, 5)}...Length: ${pkbApiKey.length})` : "MISSING";

  // 9. Upstash rate-limit credentials
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  results["UPSTASH_REDIS_REST_URL"] = upstashUrl ? `CONFIGURED (${upstashUrl.slice(0, 15)}...)` : "MISSING (Falls back to in-memory in dev; fails closed in prod)";
  results["UPSTASH_REDIS_REST_TOKEN"] = upstashToken ? `CONFIGURED (Length: ${upstashToken.length})` : "MISSING";

  // 10. Error monitoring config
  const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  results["ERROR_MONITORING"] = sentryDsn ? `CONFIGURED (Sentry DSN set)` : "NOT_CONFIGURED (Console / Server logs active)";

  // Print results table
  console.log("Parameter                         | Value / Status");
  console.log("----------------------------------|---------------------------------------------------------");
  for (const [key, val] of Object.entries(results)) {
    console.log(`${key.padEnd(34)}| ${val}`);
  }
  console.log("==========================================================\n");

  const isProductionReady =
    Boolean(authSecret) &&
    Boolean(dbUrl) &&
    dbReachable &&
    Boolean(pkbApiKey || pkbProvider === "mock");

  console.log(`Preflight Readiness: ${isProductionReady ? "✅ PASSED" : "⚠️ WARNINGS DETECTED"}`);
}

auditEnvironment().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});
