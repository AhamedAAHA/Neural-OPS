function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function readEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

function isJwtKey(key: string) {
  return key.startsWith("eyJ") && key.split(".").length === 3;
}

function isSecretApiKey(key: string) {
  return key.startsWith("sb_secret_");
}

function isPublishableApiKey(key: string) {
  return key.startsWith("sb_publishable_");
}

export function resolveSupabasePublishableKey(): string | null {
  const candidates = [
    readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    readEnv("SUPABASE_PUBLISHABLE_KEY"),
    readEnv("SUPABASE_ANON_KEY"),
  ].filter((key): key is string => Boolean(key));

  const jwtAnon = candidates.find((key) => isJwtKey(key));
  if (jwtAnon) return jwtAnon;

  const publishable = candidates.find((key) => isPublishableApiKey(key));
  return publishable ?? candidates[0] ?? null;
}

/**
 * Admin auth needs a legacy JWT service_role key, or a new sb_secret key sent
 * on the apikey header only (not as Authorization Bearer).
 */
export function resolveSupabaseAdminKey(): string | null {
  const candidates = [
    readEnv("SUPABASE_SERVICE_ROLE_KEY"),
    readEnv("SUPABASE_SECRET_KEY"),
    readEnv("SUPABASE_SERVICE_ROLE_KEY_2"),
  ].filter((key): key is string => Boolean(key));

  const jwtServiceRole = candidates.find((key) => isJwtKey(key));
  if (jwtServiceRole) return jwtServiceRole;

  const secretKey = candidates.find((key) => isSecretApiKey(key));
  return secretKey ?? null;
}

export function normalizeSupabaseProjectUrl(rawUrl: string | undefined | null): string | null {
  if (!rawUrl) return null;
  const trimmed = trimTrailingSlash(rawUrl.trim());
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (!/^https?:$/.test(parsed.protocol)) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export function isSupabaseRealtimeEnabled(url: string | null) {
  return Boolean(url);
}
