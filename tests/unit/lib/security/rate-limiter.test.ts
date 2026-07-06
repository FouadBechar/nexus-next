import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { MemoryRateLimiter } from "../../../../lib/security/rate-limiter/memory";

const originalDateNow = Date.now;

describe("MemoryRateLimiter", () => {
  afterEach(() => {
    Date.now = originalDateNow;
  });

  it("allows requests up to the configured limit", () => {
    Date.now = () => new Date("2026-07-06T10:00:00.000Z").getTime();

    const limiter = new MemoryRateLimiter();
    const request = {
      identifier: "user-allowed",
      limit: 2,
      windowMs: 60_000,
    };

    assert.deepEqual(limiter.check(request), {
      allowed: true,
      limit: 2,
      remaining: 1,
      resetAt: new Date("2026-07-06T10:01:00.000Z").getTime(),
      retryAfter: 60,
    });
    assert.equal(limiter.check(request).allowed, true);
    assert.equal(limiter.check(request).remaining, 0);
  });

  it("blocks requests beyond the configured limit until the window resets", () => {
    Date.now = () => new Date("2026-07-06T10:00:00.000Z").getTime();

    const limiter = new MemoryRateLimiter();
    const request = {
      identifier: "user-blocked",
      limit: 1,
      windowMs: 60_000,
    };

    assert.equal(limiter.check(request).allowed, true);
    assert.deepEqual(limiter.check(request), {
      allowed: false,
      limit: 1,
      remaining: 0,
      resetAt: new Date("2026-07-06T10:01:00.000Z").getTime(),
      retryAfter: 60,
    });

    Date.now = () => new Date("2026-07-06T10:01:01.000Z").getTime();

    assert.deepEqual(limiter.check(request), {
      allowed: true,
      limit: 1,
      remaining: 0,
      resetAt: new Date("2026-07-06T10:02:01.000Z").getTime(),
      retryAfter: 60,
    });
  });
});
