export type RateLimitRequest = {
  identifier: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter: number;
};

export type RateLimiter = {
  check: (request: RateLimitRequest) => RateLimitResult | Promise<RateLimitResult>;
};
