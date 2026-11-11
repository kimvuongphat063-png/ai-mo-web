#!/usr/bin/env tsx
/**
 * Environment variable validation — run before deploy or at app startup.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

interface EnvRule {
  key: string;
  required: "always" | "production" | "optional";
  description: string;
  validate?: (value: string) => string | null;
}

const RULES: EnvRule[] = [
  {
    key: "AUTH_SECRET",
    required: "always",
    description: "HMAC signing secret for session cookies",
    validate: (v) =>
      v.length < 32
        ? "Should be at least 32 characters"
        : v === "dev-secret-change-in-production"
          ? "Still using demo fallback — run: openssl rand -base64 48"
          : null,
  },
  { key: "DATABASE_URL", required: "production", description: "PostgreSQL connection string" },
  { key: "UPSTASH_REDIS_REST_URL", required: "production", description: "Upstash Redis URL" },
  { key: "UPSTASH_REDIS_REST_TOKEN", required: "production", description: "Upstash Redis token" },
  { key: "RESEND_API_KEY", required: "production", description: "Resend API key" },
  {
    key: "APP_URL",
    required: "production",
    description: "Public URL (CSRF, email links)",
    validate: (v) => (!v.startsWith("https://") ? "Should start with https://" : null),
  },
  { key: "SENTRY_DSN", required: "optional", description: "Sentry DSN" },
  { key: "GEMINI_API_KEY", required: "optional", description: "Gemini API key" },
];

function validate() {
  const isProd = process.env.NODE_ENV === "production";
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log(`\n🔍 Validating env vars (${isProd ? "PRODUCTION" : "development"})...\n`);

  for (const rule of RULES) {
    const value = process.env[rule.key];
    const requiredNow = rule.required === "always" || (rule.required === "production" && isProd);

    if (!value && requiredNow) {
      errors.push(`❌ ${rule.key} — MISSING (${rule.description})`);
    } else if (!value && rule.required === "production" && !isProd) {
      warnings.push(`⚠️  ${rule.key} — not set (OK for dev)`);
    } else if (!value) {
      console.log(`   ${rule.key} — not set (optional)`);
    } else {
      const err = rule.validate?.(value);
      if (err) {
        (isProd ? errors : warnings).push(`${isProd ? "❌" : "⚠️"}  ${rule.key} — ${err}`);
      } else {
        console.log(`✅ ${rule.key} — set`);
      }
    }
  }

  if (warnings.length) console.log(`\n${warnings.join("\n")}`);
  if (errors.length) {
    console.error(`\n${errors.join("\n")}\n\n💀 ${errors.length} error(s). Fix before deploying.\n`);
    process.exit(1);
  }
  console.log(`\n✅ All checks passed.\n`);
}

validate();
