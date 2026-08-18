import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Shared rate-limit helper. Per-org, 30 requests / 60 s sliding window by default.
//
// FAIL-OPEN by design: if Upstash is unreachable, slow, or misconfigured
// (missing env vars in local dev), checkRateLimit returns { success: true }
// so the request proceeds. A rate limiter must never be the reason the app
// goes down.
//
// Callers pass route-scoped keys (e.g. `generate:${orgId}`, `approve:${orgId}`)
// so each route gets its own 30/min budget per org — hitting the generate
// limit doesn't also block approve.
//
// A caller needing a different budget passes { limit, window } — e.g. the public
// prelaunch signup route uses 5/hour per IP. Keys are route-scoped and the Redis
// key is `${prefix}:${key}`, so two budgets never share a counter.

export type RateLimitResult = {
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
};

export type RateLimitOptions = {
  limit?: number;
  window?: Duration;
};

const DEFAULT_LIMIT = 30;
const DEFAULT_WINDOW: Duration = "60 s";

let cachedRedis: Redis | null = null;
let initAttempted = false;
const limiters = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  if (initAttempted) return cachedRedis;
  initAttempted = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Logged once on first call. Local dev without Upstash configured, or a
    // misconfigured deploy, degrades to "no rate limiting" rather than 500s.
    console.warn(
      "[rateLimit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — rate limiting disabled (fail-open)."
    );
    return null;
  }

  cachedRedis = new Redis({ url, token });
  return cachedRedis;
}

function getLimiter(limit: number, window: Duration): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const cacheKey = `${limit}:${window}`;
  const existing = limiters.get(cacheKey);
  if (existing) return existing;

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: false, // free-tier command budget — analytics adds commands
    prefix: "localizer_rl",
  });

  limiters.set(cacheKey, limiter);
  return limiter;
}

export async function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const limiter = getLimiter(
    options.limit ?? DEFAULT_LIMIT,
    options.window ?? DEFAULT_WINDOW
  );
  if (!limiter) return { success: true };

  try {
    const result = await limiter.limit(key);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    // Upstash down, network failure, timeout — fail open.
    console.warn("[rateLimit] check failed, allowing request through:", error);
    return { success: true };
  }
}
