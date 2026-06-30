import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Shared rate-limit helper. Per-org, 30 requests / 60 s sliding window.
//
// FAIL-OPEN by design: if Upstash is unreachable, slow, or misconfigured
// (missing env vars in local dev), checkRateLimit returns { success: true }
// so the request proceeds. A rate limiter must never be the reason the app
// goes down.
//
// Callers pass route-scoped keys (e.g. `generate:${orgId}`, `approve:${orgId}`)
// so each route gets its own 30/min budget per org — hitting the generate
// limit doesn't also block approve.

export type RateLimitResult = {
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
};

let cachedLimiter: Ratelimit | null = null;
let initAttempted = false;

function getLimiter(): Ratelimit | null {
  if (initAttempted) return cachedLimiter;
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

  const redis = new Redis({ url, token });

  cachedLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "60 s"),
    analytics: false, // free-tier command budget — analytics adds commands
    prefix: "localizer_rl",
  });

  return cachedLimiter;
}

export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  const limiter = getLimiter();
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
