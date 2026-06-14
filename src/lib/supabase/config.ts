function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
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
