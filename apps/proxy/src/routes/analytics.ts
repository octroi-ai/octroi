import { Hono } from "hono";
import { requests } from "@tokenforge/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { getDb } from "../lib/db";
import { logger } from "../lib/logger";

export const analyticsRoutes = new Hono();

// Analytics read directly from PostgreSQL (the `requests` table the proxy
// already persists to), using the same query-builder pattern as the ESG route.
// This keeps the dashboards working on the managed Supabase stack without a
// separate ClickHouse deployment.

// GET /v1/analytics/usage
analyticsRoutes.get("/usage", async (c) => {
  const orgId = c.get("orgId");
  const from = new Date(c.req.query("from") || Date.now() - 30 * 86400000);
  const to = new Date(c.req.query("to") || Date.now());
  const model = c.req.query("model");
  const projectId = c.req.query("project_id");

  try {
    const conditions = [
      eq(requests.orgId, orgId),
      gte(requests.timestamp, from),
      lte(requests.timestamp, to),
    ];
    if (model) conditions.push(eq(requests.model, model));
    if (projectId) conditions.push(eq(requests.projectId, projectId));

    const data = await getDb()
      .select({
        date: sql<string>`to_char(date_trunc('day', ${requests.timestamp}), 'YYYY-MM-DD')`,
        provider: requests.provider,
        model: requests.model,
        total_input_tokens: sql<number>`sum(${requests.inputTokens})`,
        total_output_tokens: sql<number>`sum(${requests.outputTokens})`,
        total_tokens: sql<number>`sum(${requests.inputTokens} + ${requests.outputTokens})`,
        total_cost: sql<number>`sum(${requests.costUsd})`,
        avg_latency: sql<number>`avg(${requests.latencyMs})`,
        request_count: sql<number>`count(*)`,
        cache_hits: sql<number>`count(*) filter (where ${requests.cached})`,
      })
      .from(requests)
      .where(and(...conditions))
      .groupBy(sql`date_trunc('day', ${requests.timestamp})`, requests.provider, requests.model)
      .orderBy(sql`date_trunc('day', ${requests.timestamp}) desc`);

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
    const rows = await getDb()
      .select({
        actual_cost: sql<number>`coalesce(sum(${requests.costUsd}), 0)`,
        cache_savings: sql<number>`coalesce(sum(${requests.costUsd}) filter (where ${requests.cached}), 0)`,
        total_requests: sql<number>`count(*)`,
        cached_requests: sql<number>`count(*) filter (where ${requests.cached})`,
        avg_latency: sql<number>`coalesce(avg(${requests.latencyMs}), 0)`,
      })
      .from(requests)
      .where(and(eq(requests.orgId, orgId), gte(requests.timestamp, from), lte(requests.timestamp, to)));

    return c.json({ savings: rows[0] || {}, period: { from: from.toISOString(), to: to.toISOString() } });
  } catch (error: any) {
    logger.error("Savings error", { error: error.message });
    return c.json({ error: "Failed to calculate savings" }, 500);
  }
});
