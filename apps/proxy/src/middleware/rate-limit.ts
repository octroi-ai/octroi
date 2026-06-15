import type { Context, Next } from "hono";
import { organizations } from "@tokenforge/db";
import { eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import { getRedis } from "../lib/redis";
import { Errors } from "../lib/errors";
import { logger } from "../lib/logger";

const RATE_LIMITS: Record<string, { requests: number; windowMs: number }> = {
  free: { requests: 100, windowMs: 60_000 },
  pro: { requests: 5_000, windowMs: 60_000 },
  business: { requests: 50_000, windowMs: 60_000 },
  enterprise: { requests: 500_000, windowMs: 60_000 },
};

async function getOrgPlan(orgId: string): Promise<string> {
  const redis = getRedis();
  const cacheKey = `orgplan:${orgId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return cached;

    const [org] = await getDb()
      .select({ plan: organizations.plan })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    const plan = org?.plan || "free";
    await redis.setex(cacheKey, 300, plan);
    return plan;
  } catch {
    return "free";
  }
}

export async function rateLimitMiddleware(c: Context, next: Next) {
  const orgId = c.get("orgId");
  if (!orgId) return next();

  const plan = await getOrgPlan(orgId);
  const limit = RATE_LIMITS[plan] || RATE_LIMITS.free;
  const key = `ratelimit:${orgId}`;

  try {
    const redis = getRedis();
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.pexpire(key, limit.windowMs);
    }

    c.header("X-RateLimit-Limit", limit.requests.toString());
    c.header("X-RateLimit-Remaining", Math.max(0, limit.requests - current).toString());

    if (current > limit.requests) {
      throw Errors.rateLimited();
    }
  } catch (error) {
    if ((error as any).name === "AppError") throw error;
    logger.error("Rate limit error", { error: (error as Error).message });
  }

  await next();
}
