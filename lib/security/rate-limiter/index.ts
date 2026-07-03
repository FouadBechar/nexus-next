import { MemoryRateLimiter } from "./memory";
import type { RateLimitRequest, RateLimitResult } from "./types";

const rateLimiter = new MemoryRateLimiter();

export function checkRateLimit(
  request: RateLimitRequest
): RateLimitResult | Promise<RateLimitResult> {
  return rateLimiter.check(request);
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "Retry-After": result.retryAfter.toString(),
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetAt / 1000).toString(),
  };
}
