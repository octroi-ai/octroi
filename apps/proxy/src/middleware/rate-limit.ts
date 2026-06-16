import type { Context, Next } from "hono";
import { organizations } from "@tokenforge/db";
import { eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import { getRedis, REDIS_ENABLED } from "../lib/redis";
import { Errors } from "../lib/errors";
import { logger } from "../lib/logger";

const RATE_LIMITS: Record<string, { requests: number; windowMs: number }> = {
  free: { requests: 100, windowMs: 60_000 },
  pro: { requests: 5_000, windowMs: 60_000 },
  business: { requests: 50_000, windowMs: 60_000 },
  enterprise: { requests: 500_000, windowMs: 60_000 },
};

// In-memory fallbacks (per instance) used when Redis is not configured.
const planMemo = new Map<string, { plan: string; exp: number }>();
const memCounters = new Map<string, { count: number; resetAt: number }>();

function memRateLimit(key: string, windowMs: number): number {
  const now = Date.now();
  const e = memCounters.get(key);
  if (!e || e.resetAt <= now) {
    memCounters.set(key, { count: 1, resetAt: now + windowMs });
    return 1;
  }
  e.count += 1;
  return e.count;
}

async function lookupPlan(orgId: string): Promise<string> {
  const [org] = await getDb()
    .select({ plan: organizations.plan })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  return org?.plan || "free";
}

async function getOrgPlan(orgId: string): Promise<string> {
  if (REDIS_ENABLED) {
    const redis = getRedis();
    const cacheKey = `orgplan:${orgId}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached;
      const plan = await lookupPlan(orgId);
      await redis.setex(cacheKey, 300, plan);
      return plan;
    } catch {
      return "free";
    }
  }
  // No Redis: query the DB with a small in-memory memo to avoid per-request hits.
  const cached = planMemo.get(orgId);
  if (cached && cached.exp > Date.now()) return cached.plan;
  try {
    const plan = await lookupPlan(orgId);
    planMemo.set(orgId, { plan, exp: Date.now() + 300_000 });
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
    let current: number;
    if (REDIS_ENABLED) {
      const redis = getRedis();
      current = await redis.incr(key);
      if (current === 1) {
        await redis.pexpire(key, limit.windowMs);
      }
    } else {
      current = memRateLimit(key, limit.windowMs);
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
