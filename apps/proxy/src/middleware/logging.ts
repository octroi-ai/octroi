import type { Context, Next } from "hono";
import { getClickHouse } from "../lib/clickhouse";
import { logger } from "../lib/logger";

export async function loggingMiddleware(c: Context, next: Next) {
  const startTime = Date.now();

  await next();

  const latencyMs = Date.now() - startTime;

  const logEntry = {
    org_id: c.get("orgId") || "",
    method: c.req.method,
    path: c.req.path,
    status_code: c.res.status,
    latency_ms: latencyMs,
    request_id: c.get("requestId") || "",
    timestamp: new Date().toISOString(),
  };

  getClickHouse()
    .insert({
      table: "requests",
      values: [logEntry],
      format: "JSONEachRow",
    })
    .catch((err) => logger.error("ClickHouse logging error", { error: err.message }));
}
