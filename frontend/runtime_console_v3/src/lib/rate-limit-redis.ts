import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { clientIpFromHeaders, rateLimit, type RateLimitResult } from "@/lib/api/rate-limit";

export type RateLimitTier = "public" | "authenticated" | "search" | "checkout";

const redisConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);

function createRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

let ratelimiters: Record<RateLimitTier, Ratelimit> | null = null;

function getRatelimiters(): Record<RateLimitTier, Ratelimit> {
  if (!ratelimiters) {
    const redis = createRedis();
    ratelimiters = {
      public: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, "1 m"),
        analytics: true,
        prefix: "ratelimit:public",
      }),
      authenticated: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"),
        analytics: true,
        prefix: "ratelimit:auth",
      }),
      search: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "1 m"),
        analytics: true,
        prefix: "ratelimit:search",
      }),
      checkout: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        analytics: true,
        prefix: "ratelimit:checkout",
      }),
    };
  }
  return ratelimiters;
}

const TIER_LIMITS: Record<RateLimitTier, number> = {
  public: 30,
  authenticated: 100,
  search: 20,
  checkout: 5,
};

export function getRateLimitTier(request: Request): RateLimitTier {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return "authenticated";
  }

  const path = new URL(request.url).pathname;
  if (path.includes("/search")) return "search";
  if (path.includes("/checkout")) return "checkout";

  return "public";
}

export function isRedisRateLimitEnabled(): boolean {
  return redisConfigured;
}

/** Rate limit distribuído (Upstash) com fallback em memória para dev/CI sem Redis. */
export async function checkDistributedRateLimit(
  identifier: string,
  tier: RateLimitTier,
): Promise<RateLimitResult> {
  if (!redisConfigured) {
    const limit = TIER_LIMITS[tier];
    return rateLimit(`${tier}:${identifier}`, limit, 60_000);
  }

  const limiter = getRatelimiters()[tier];
  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const retryAfter = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
    "Retry-After": String(retryAfter),
  };
}

export function clientIpFromRequest(request: Request): string {
  return clientIpFromHeaders(request.headers);
}
