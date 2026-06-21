interface HitBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, HitBucket>();

export function checkRateLimit(key: string, now = Date.now()): boolean {
  const windowMs = 15 * 60 * 1000;
  const maxHits = 8;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= maxHits) return false;
  bucket.count += 1;
  return true;
}
