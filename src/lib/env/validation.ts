import { z } from "zod";
import { normalizeSupabaseProjectUrl } from "@/lib/supabase/config";

function readEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

const CoreEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export interface EnvValidationResult {
  ok: boolean;
  checkedAt: string;
  required: {
    ok: boolean;
    missing: string[];
    invalid: string[];
  };
  integrations: {
    ok: boolean;
    missing: string[];
  };
  optionalWarnings: string[];
}

function collectSchemaIssues(result: { success: false; error: z.ZodError } | { success: true; data: unknown }) {
  const missing: string[] = [];
  const invalid: string[] = [];

  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key !== "string") continue;
      if (issue.code === "invalid_type" && issue.message.includes("undefined")) {
        missing.push(key);
      } else {
        invalid.push(key);
      }
    }
  }

  return { missing, invalid };
}

export function validateCoreEnvironment() {
  const parsed = CoreEnvSchema.safeParse(process.env);
  const { missing, invalid } = collectSchemaIssues(parsed);

  const normalizedSupabaseUrl = normalizeSupabaseProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !normalizedSupabaseUrl) {
    invalid.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  const ok = parsed.success && missing.length === 0 && invalid.length === 0;
  return {
    ok,
    missing: [...new Set(missing)].sort(),
    invalid: [...new Set(invalid)].sort(),
  };
}

export function validateLiveIntegrations() {
  const missing: string[] = [];
  const optionalWarnings: string[] = [];

  const bandKey = readEnv("BAND_API_KEY");
  const bandWorkspace = readEnv("BAND_WORKSPACE_ID");
  const bandSecret = readEnv("BAND_AGENT_SECRET");
  const aimlKey = readEnv("AIML_API_KEY");
  const featherlessKey = readEnv("FEATHERLESS_API_KEY");
  const openAiKey = readEnv("OPENAI_API_KEY");
  const brightDataKey = readEnv("BRIGHT_DATA_API_KEY");
  const brightDataSerp = readEnv("BRIGHT_DATA_SERP_ZONE");
  const brightDataUnlocker = readEnv("BRIGHT_DATA_WEB_UNLOCKER_ZONE");
  const speechmaticsKey = readEnv("SPEECHMATICS_API_KEY");
  const sentryDsn = readEnv("SENTRY_DSN");

  if (!bandKey || !bandWorkspace || !bandSecret) {
    optionalWarnings.push("Band credentials are incomplete; MockBandAdapter fallback will be used.");
  }

  if (!brightDataKey || !brightDataSerp || !brightDataUnlocker) {
    optionalWarnings.push("Bright Data credentials are incomplete; vendor intelligence will return configuration warnings.");
  }

  if (!speechmaticsKey) {
    optionalWarnings.push("Speechmatics API key is missing; speech features will run in fallback mode.");
  }

  if (!sentryDsn) {
    optionalWarnings.push("Sentry DSN is missing; remote error tracking is disabled.");
  }

  const isProduction = process.env.NODE_ENV === "production";
  const strictLive = isProduction && process.env.ENV_VALIDATION_STRICT !== "false";

  if (strictLive) {
    if (process.env.AUTH_DEV_MODE === "true") {
      missing.push("AUTH_DEV_MODE(must be false in production)");
    }

    if (process.env.USE_MOCK_BAND !== "true") {
      if (!bandKey) missing.push("BAND_API_KEY");
      if (!bandWorkspace) missing.push("BAND_WORKSPACE_ID");
      if (!bandSecret) missing.push("BAND_AGENT_SECRET");
    }

    if (!aimlKey && !featherlessKey && !openAiKey) {
      missing.push("AIML_API_KEY|FEATHERLESS_API_KEY|OPENAI_API_KEY");
    }

    if (process.env.USE_MOCK_BRIGHT_DATA !== "true") {
      if (!brightDataKey) missing.push("BRIGHT_DATA_API_KEY");
      if (!brightDataSerp) missing.push("BRIGHT_DATA_SERP_ZONE");
      if (!brightDataUnlocker) missing.push("BRIGHT_DATA_WEB_UNLOCKER_ZONE");
    }

    if (process.env.USE_MOCK_SPEECHMATICS !== "true" && !speechmaticsKey) {
      missing.push("SPEECHMATICS_API_KEY");
    }
  }

  const integrationMissing = [...new Set(missing)].sort();
  return {
    ok: integrationMissing.length === 0,
    missing: integrationMissing,
    optionalWarnings,
  };
}

export function validateEnvironment(): EnvValidationResult {
  const core = validateCoreEnvironment();
  const integrations = validateLiveIntegrations();

  return {
    ok: core.ok && integrations.ok,
    checkedAt: new Date().toISOString(),
    required: {
      ok: core.ok,
      missing: core.missing,
      invalid: core.invalid,
    },
    integrations: {
      ok: integrations.ok,
      missing: integrations.missing,
    },
    optionalWarnings: integrations.optionalWarnings,
  };
}

export function enforceEnvironmentIfStrict() {
  const strict = process.env.ENV_VALIDATION_STRICT !== "false";
  const core = validateCoreEnvironment();
  const isBuildTime =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PRIVATE_BUILD_WORKER === "1";

  if (strict && process.env.NODE_ENV === "production" && !isBuildTime && !core.ok) {
    throw new Error(
      `Environment validation failed. Missing: ${core.missing.join(", ") || "none"}; Invalid: ${core.invalid.join(", ") || "none"}`
    );
  }

  return validateEnvironment();
}
