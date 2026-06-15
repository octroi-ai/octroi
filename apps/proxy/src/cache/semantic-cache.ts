import { createHash } from "crypto";
import { getRedis } from "../lib/redis";
import { logger } from "../lib/logger";

const CACHE_TTL = 3600; // 1 hour
const CACHE_PREFIX = "tokenforge:cache:";

export async function checkCache(key: string): Promise<any | null> {
  try {
    const hash = createHash("sha256").update(key).digest("hex");
    const cached = await getRedis().get(`${CACHE_PREFIX}${hash}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    logger.error("Cache read error", { error: (error as Error).message });
    return null;
  }
}

export async function setCache(key: string, value: any): Promise<void> {
  try {
    const hash = createHash("sha256").update(key).digest("hex");
    await getRedis().setex(`${CACHE_PREFIX}${hash}`, CACHE_TTL, JSON.stringify(value));
  } catch (error) {
    logger.error("Cache write error", { error: (error as Error).message });
  }
}

export async function invalidateCache(pattern?: string): Promise<void> {
  try {
    const redis = getRedis();
    if (pattern) {
      const keys = await redis.keys(`${CACHE_PREFIX}${pattern}*`);
      if (keys.length > 0) await redis.del(...keys);
    } else {
      const keys = await redis.keys(`${CACHE_PREFIX}*`);
      if (keys.length > 0) await redis.del(...keys);
    }
  } catch (error) {
    logger.error("Cache invalidation error", { error: (error as Error).message });
  }
}
