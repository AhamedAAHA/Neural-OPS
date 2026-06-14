import { z } from "zod";
import { normalizeSupabaseProjectUrl } from "@/lib/supabase/config";

const RequiredServerEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const OptionalIntegrationsSchema = z.object({
  BAND_API_KEY: z.string().optional(),
  BAND_WORKSPACE_ID: z.string().optional(),
  BAND_AGENT_SECRET: z.string().optional(),
  AIML_API_KEY: z.string().optional(),
  FEATHERLESS_API_KEY: z.string().optional(),
  BRIGHT_DATA_API_KEY: z.string().optional(),
  BRIGHT_DATA_SERP_ZONE: z.string().optional(),
  BRIGHT_DATA_WEB_UNLOCKER_ZONE: z.string().optional(),
  SPEECHMATICS_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

export interface EnvValidationResult {
  ok: boolean;
  checkedAt: string;
  required: {
    ok: boolean;
    missing: string[];
    invalid: string[];
  };
  optionalWarnings: string[];
}

export function validateEnvironment(): EnvValidationResult {
  const required = RequiredServerEnvSchema.safeParse(process.env);
  const optional = OptionalIntegrationsSchema.parse(process.env);

  const missing: string[] = [];
  const invalid: string[] = [];

  if (!required.success) {
    for (const issue of required.error.issues) {
      const key = issue.path[0];
      if (typeof key !== "string") continue;
      if (issue.code === "invalid_type" && issue.message.includes("undefined")) {
        missing.push(key);
      } else {
        invalid.push(key);
      }
    }
  }

  const normalizedSupabaseUrl = normalizeSupabaseProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !normalizedSupabaseUrl) {
    invalid.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  const optionalWarnings: string[] = [];

  if (!optional.BAND_API_KEY || !optional.BAND_WORKSPACE_ID || !optional.BAND_AGENT_SECRET) {
    optionalWarnings.push("Band credentials are incomplete; MockBandAdapter fallback will be used.");
  }

  if (!optional.BRIGHT_DATA_API_KEY || !optional.BRIGHT_DATA_SERP_ZONE || !optional.BRIGHT_DATA_WEB_UNLOCKER_ZONE) {
    optionalWarnings.push("Bright Data credentials are incomplete; vendor intelligence will return configuration warnings.");
  }

  if (!optional.SPEECHMATICS_API_KEY) {
    optionalWarnings.push("Speechmatics API key is missing; speech features will run in fallback mode.");
  }

  if (!optional.SENTRY_DSN) {
    optionalWarnings.push("Sentry DSN is missing; remote error tracking is disabled.");
  }

  return {
    ok: required.success,
    checkedAt: new Date().toISOString(),
    required: {
      ok: required.success,
      missing: [...new Set(missing)].sort(),
      invalid: [...new Set(invalid)].sort(),
    },
    optionalWarnings,
  };
}

export function enforceEnvironmentIfStrict() {
  const strict = process.env.ENV_VALIDATION_STRICT !== "false";
  const result = validateEnvironment();
  const isBuildTime =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PRIVATE_BUILD_WORKER === "1";

  if (strict && process.env.NODE_ENV === "production" && !isBuildTime && !result.ok) {
    throw new Error(
      `Environment validation failed. Missing: ${result.required.missing.join(", ") || "none"}; Invalid: ${result.required.invalid.join(", ") || "none"}`
    );
  }
  return result;
}
