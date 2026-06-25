import { Redis } from "@upstash/redis";

const redisConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

function cacheKey(queryString: string): string {
  return `search:v1:${Buffer.from(queryString).toString("base64url")}`;
}

export function isSearchCacheEnabled(): boolean {
  return redisConfigured;
}

export async function getCachedSearch<T>(queryString: string): Promise<T | null> {
  if (!redisConfigured) return null;
  try {
    const cached = await getRedis().get<T>(cacheKey(queryString));
    return cached ?? null;
  } catch {
    return null;
  }
}

export async function setCachedSearch<T>(queryString: string, data: T, ttlSeconds = 300): Promise<void> {
  if (!redisConfigured) return;
  try {
    await getRedis().set(cacheKey(queryString), data, { ex: ttlSeconds });
  } catch {
    // Cache miss on write failure — não bloqueia a resposta
  }
}
