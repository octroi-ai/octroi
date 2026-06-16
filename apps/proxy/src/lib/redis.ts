import Redis from "ioredis";
import { config } from "../config";
import { logger } from "./logger";

// Redis is OPTIONAL. It counts as enabled only when REDIS_URL points at a real
// (non-localhost-default) server. When disabled, callers skip Redis entirely so
// a missing Redis never adds latency or causes 502s — the proxy degrades to an
// in-memory rate limiter and no response cache.
export const REDIS_ENABLED =
  !!config.REDIS_URL &&
  config.REDIS_URL !== "redis://localhost:6379" &&
  !/\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(config.REDIS_URL);

let _redis: Redis | null = null;
let _loggedError = false;

export function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis(config.REDIS_URL, {
      lazyConnect: true,
      enableOfflineQueue: false, // reject commands immediately when not connected
      maxRetriesPerRequest: 1,
      connectTimeout: 800,
      retryStrategy: () => null, // never sit in a multi-second reconnect loop
    });
    _redis.on("error", (err) => {
      if (!_loggedError) {
        _loggedError = true;
        logger.error("Redis unavailable — continuing without it", { error: err.message });
      }
    });
  }
  return _redis;
}
