import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { getDb } from "../lib/db";
import { logger } from "../lib/logger";

export const analyticsRoutes = new Hono();

// Analytics read directly from PostgreSQL (the `requests` table the proxy
// already persists to). This keeps the dashboards working on the managed
// Supabase stack without requiring a separate ClickHouse deployment.

// GET /v1/analytics/usage
analyticsRoutes.get("/usage", async (c) => {
  const orgId = c.get("orgId");
  const from = new Date(c.req.query("from") || Date.now() - 30 * 86400000);
  const to = new Date(c.req.query("to") || Date.now());
  const model = c.req.query("model");
  const projectId = c.req.query("project_id");

  try {
    const result: any = await getDb().execute(sql`
      SELECT
        to_char(date_trunc('day', timestamp), 'YYYY-MM-DD') AS date,
        provider, model,
        sum(input_tokens)::float8  AS total_input_tokens,
        sum(output_tokens)::float8 AS total_output_tokens,
        sum(input_tokens + output_tokens)::float8 AS total_tokens,
        sum(cost_usd)::float8 AS total_cost,
        avg(latency_ms)::float8 AS avg_latency,
        count(*)::int AS request_count,
        count(*) FILTER (WHERE cached)::int AS cache_hits
      FROM requests
      WHERE org_id = ${orgId}
        AND timestamp >= ${from} AND timestamp <= ${to}
        ${model ? sql`AND model = ${model}` : sql``}
        ${projectId ? sql`AND project_id = ${projectId}` : sql``}
      GROUP BY 1, provider, model
      ORDER BY 1 DESC
    `);
    const data = Array.isArray(result) ? result : result.rows ?? [];
    return c.json({ data, period: { from: from.toISOString(), to: to.toISOString() } });
  } catch (error: any) {
    logger.error("Analytics error", { error: error.message });
    return c.json({ error: "Failed to fetch analytics" }, 500);
  }
});

// GET /v1/analytics/savings
analyticsRoutes.get("/savings", async (c) => {
  const orgId = c.get("orgId");
  const from = new Date(c.req.query("from") || Date.now() - 30 * 86400000);
  const to = new Date(c.req.query("to") || Date.now());

  try {
    const result: any = await getDb().execute(sql`
      SELECT
        coalesce(sum(cost_usd), 0)::float8 AS actual_cost,
        coalesce(sum(cost_usd) FILTER (WHERE cached), 0)::float8 AS cache_savings,
        count(*)::int AS total_requests,
        count(*) FILTER (WHERE cached)::int AS cached_requests,
        coalesce(avg(latency_ms), 0)::float8 AS avg_latency
      FROM requests
      WHERE org_id = ${orgId}
        AND timestamp >= ${from} AND timestamp <= ${to}
    `);
    const rows = Array.isArray(result) ? result : result.rows ?? [];
    return c.json({ savings: rows[0] || {}, period: { from: from.toISOString(), to: to.toISOString() } });
  } catch (error: any) {
    logger.error("Savings error", { error: error.message });
    return c.json({ error: "Failed to calculate savings" }, 500);
  }
});
