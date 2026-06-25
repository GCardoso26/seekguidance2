/**
 * Cliente Redis unificado (Upstash).
 * Reexporta cache de busca e rate limiting distribuído.
 */
export { isSearchCacheEnabled, getCachedSearch, setCachedSearch } from "@/lib/search-cache";
export {
  isRedisRateLimitEnabled,
  checkDistributedRateLimit,
  getRateLimitTier,
  rateLimitHeaders,
  clientIpFromRequest,
  type RateLimitTier,
} from "@/lib/rate-limit-redis";

import { Redis } from "@upstash/redis";

const configured = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

let client: Redis | null = null;

export function getRedis(): Redis | null {
  if (!configured) return null;
  if (!client) {
    client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return client;
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    return (await redis.get<T>(key)) ?? null;
  } catch {
    return null;
  }
}

export async function setCachedJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // noop
  }
}
