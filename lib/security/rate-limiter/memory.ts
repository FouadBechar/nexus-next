import type { RateLimitRequest, RateLimitResult, RateLimiter } from "./types";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

function pruneExpiredBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export class MemoryRateLimiter implements RateLimiter {
  check({ identifier, limit, windowMs }: RateLimitRequest): RateLimitResult {
    const now = Date.now();

    pruneExpiredBuckets(now);

    const existingBucket = buckets.get(identifier);
    const bucket =
      existingBucket && existingBucket.resetAt > now
        ? existingBucket
        : {
            count: 0,
            resetAt: now + windowMs,
          };

    bucket.count += 1;
    buckets.set(identifier, bucket);

    const remaining = Math.max(0, limit - bucket.count);
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

    return {
      allowed: bucket.count <= limit,
      limit,
      remaining,
      resetAt: bucket.resetAt,
      retryAfter,
    };
  }
}
