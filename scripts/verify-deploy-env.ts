/**
 * Verify production deployment environment before release.
 * Usage: NODE_ENV=production npx tsx scripts/verify-deploy-env.ts
 */
import { config } from "dotenv";
import path from "node:path";
import { validateCoreEnvironment, validateEnvironment, validateLiveIntegrations } from "../src/lib/env/validation";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

if (!process.env.NODE_ENV) {
  Object.assign(process.env, { NODE_ENV: "production" });
}

const core = validateCoreEnvironment();
const integrations = validateLiveIntegrations();
const env = validateEnvironment();

console.log("Neural OPS deploy environment check");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("");

console.log("Core (required to boot):", core.ok ? "PASS" : "FAIL");
if (!core.ok) {
  console.log("  missing:", core.missing.join(", ") || "none");
  console.log("  invalid:", core.invalid.join(", ") || "none");
}

console.log("Live integrations:", integrations.ok ? "PASS" : "FAIL");
if (!integrations.ok) {
  console.log("  missing:", integrations.missing.join(", ") || "none");
}

if (env.optionalWarnings.length > 0) {
  console.log("");
  console.log("Warnings:");
  for (const warning of env.optionalWarnings) {
    console.log(`  - ${warning}`);
  }
}

console.log("");
if (!core.ok) {
  process.exitCode = 1;
  console.error("Deploy blocked: core environment is incomplete.");
} else if (!integrations.ok) {
  process.exitCode = 1;
  console.error("Deploy blocked: live integration keys are incomplete.");
} else {
  console.log("Deploy environment is ready.");
}
