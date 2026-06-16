import { Hono } from "hono";
import { cors } from "hono/cors";
import { timing } from "hono/timing";
import { bodyLimit } from "hono/body-limit";
import { config } from "./config";
import { proxyRoutes } from "./routes/proxy";
import { analyticsRoutes } from "./routes/analytics";
import { esgRoutes } from "./routes/esg";
import { complianceRoutes } from "./routes/compliance";
import { brokerRoutes } from "./routes/broker";
import { authRoutes } from "./routes/auth";
import { authMiddleware } from "./middleware/auth";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { loggingMiddleware } from "./middleware/logging";
import { requestIdMiddleware } from "./middleware/request-id";
import { securityHeaders } from "./middleware/security-headers";
import { errorHandler } from "./middleware/error-handler";
import { logger } from "./lib/logger";
import { getDb } from "./lib/db";
import { getRedis, REDIS_ENABLED } from "./lib/redis";
import { getClickHouse, CLICKHOUSE_ENABLED } from "./lib/clickhouse";

const app = new Hono();

// Global error handler
app.onError(errorHandler);

// Global middleware
app.use("*", requestIdMiddleware);
app.use("*", securityHeaders);
app.use(
  "*",
  cors({
    origin: config.allowedOrigins,
    allowHeaders: ["Content-Type", "X-Octroi-Key", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    maxAge: 86400,
  })
);
app.use("*", timing());
app.use("*", bodyLimit({ maxSize: 1024 * 1024 })); // 1 MB

// Liveness probe (always responds if process is alive)
app.get("/health/live", (c) => c.json({ status: "ok" }));

// Readiness / detailed health check
app.get("/health", async (c) => {
  const checks: Record<string, { status: string; latency_ms?: number }> = {};

  // Check PostgreSQL
  const dbStart = Date.now();
  try {
    await getDb().execute("SELECT 1" as any);
    checks.db = { status: "ok", latency_ms: Date.now() - dbStart };
  } catch {
    checks.db = { status: "error", latency_ms: Date.now() - dbStart };
  }

  // Check Redis (optional — disabled when no real REDIS_URL is configured)
  if (REDIS_ENABLED) {
    const redisStart = Date.now();
    try {
      await getRedis().ping();
      checks.redis = { status: "ok", latency_ms: Date.now() - redisStart };
    } catch {
      checks.redis = { status: "error", latency_ms: Date.now() - redisStart };
    }
  } else {
    checks.redis = { status: "disabled" };
  }

  // Check ClickHouse (optional — analytics read from Postgres)
  if (CLICKHOUSE_ENABLED) {
    const chStart = Date.now();
    try {
      await getClickHouse().ping();
      checks.clickhouse = { status: "ok", latency_ms: Date.now() - chStart };
    } catch {
      checks.clickhouse = { status: "error", latency_ms: Date.now() - chStart };
    }
  } else {
    checks.clickhouse = { status: "disabled" };
  }

  const allHealthy = Object.values(checks).every((c) => c.status === "ok" || c.status === "disabled");

  return c.json(
    {
      status: allHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || "dev",
      checks,
    },
    allHealthy ? 200 : 503
  );
});

app.get("/health/ready", async (c) => {
  try {
    await getDb().execute("SELECT 1" as any);
    return c.json({ status: "ok" });
  } catch {
    return c.json({ status: "error" }, 503);
  }
});

// Public account endpoints (register / login) — no API key required.
app.route("/auth", authRoutes);

// API v1 routes — require authentication
const api = new Hono();
api.use("*", authMiddleware);
api.use("*", rateLimitMiddleware);
api.use("*", loggingMiddleware);

// Mount route modules
api.route("/v1", proxyRoutes);
api.route("/v1/analytics", analyticsRoutes);
api.route("/v1/esg", esgRoutes);
api.route("/v1/compliance", complianceRoutes);
api.route("/v1/broker", brokerRoutes);

app.route("/api", api);

logger.info(`Octroi Proxy starting on port ${config.PROXY_PORT}`, {
  env: config.NODE_ENV,
  port: config.PROXY_PORT,
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  try {
    if (REDIS_ENABLED) await getRedis().quit();
    if (CLICKHOUSE_ENABLED) await getClickHouse().close();
  } catch (err) {
    logger.error("Error during shutdown", { error: (err as Error).message });
  }
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default {
  port: config.PROXY_PORT,
  fetch: app.fetch,
};
