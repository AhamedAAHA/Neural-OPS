const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, max: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  bucket.count += 1;
  if (bucket.count > max) return true;
  return false;
}
