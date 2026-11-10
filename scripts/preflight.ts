/**
 * Preflight guard — shared by all scripts that read/write the Studio database.
 *
 * Call `preflightGuard()` at the top of any script that touches Postgres, JSON
 * studio data, or starts a dev server.  It asserts the script is running inside
 * the correct workspace and prints the absolute project path for traceability.
 *
 * Usage:
 *   import { preflightGuard } from "./preflight";
 *   await preflightGuard({ requireStudio: true });
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export interface PreflightOptions {
  /** Require `src/lib/studio` to exist (all Studio scripts). Default: true. */
  requireStudio?: boolean;
}

const EXPECTED_PACKAGE_NAME = "digital-product-store";

/**
 * Known workspace paths that are NOT this project.
 * The guard will fail immediately if the resolved cwd matches any of them,
 * catching the case where a developer accidentally runs Studio scripts from
 * the wrong checkout (e.g. the `monopoly-go-marketplace` frontend).
 */
const BLOCKED_WORKSPACE_MARKERS = [
  // desktop frontend (different project entirely)
  "monopoly-go-marketplace",
];

export async function preflightGuard(opts: PreflightOptions = {}) {
  const { requireStudio = true } = opts;
  const cwd = process.cwd();
  const abs = path.resolve(cwd);

  console.log(`[preflight] project path: ${abs}`);

  // ── package name check ─────────────────────────────────────────────────────
  const pkgPath = path.join(abs, "package.json");
  if (!existsSync(pkgPath)) {
    console.error(`[preflight] FATAL: no package.json at ${pkgPath}`);
    console.error("  This script must be run inside the project root.");
    process.exit(1);
  }
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  if (pkg.name !== EXPECTED_PACKAGE_NAME) {
    console.error(`[preflight] FATAL: package name is "${pkg.name}", expected "${EXPECTED_PACKAGE_NAME}".`);
    console.error("  You appear to be in the wrong project.");
    process.exit(1);
  }

  // ── blocked workspace check ────────────────────────────────────────────────
  const lowerAbs = abs.toLowerCase();
  for (const marker of BLOCKED_WORKSPACE_MARKERS) {
    if (lowerAbs.includes(marker.toLowerCase())) {
      console.error(`[preflight] FATAL: path "${abs}" contains blocked marker "${marker}".`);
      console.error("  Studio scripts must not run in the monopoly-go-marketplace workspace.");
      process.exit(1);
    }
  }

  // ── Studio marker check ────────────────────────────────────────────────────
  if (requireStudio) {
    const studioDir = path.join(abs, "src", "lib", "studio");
    if (!existsSync(studioDir)) {
      console.error(`[preflight] FATAL: src/lib/studio does not exist at ${studioDir}`);
      console.error("  This script must be run inside a workspace that contains the Studio code.");
      process.exit(1);
    }
  }

  console.log(`[preflight] OK — workspace "${pkg.name}" is valid.`);
}
