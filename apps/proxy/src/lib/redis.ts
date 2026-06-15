import Redis from "ioredis";
import { config } from "../config";

let _redis: Redis | null = null;

export function getRedis() {
  if (!_redis) {
    _redis = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 200, 2000);
      },
    });
  }
  return _redis;
}
