import { Hono } from "hono";
import { getClickHouse } from "../lib/clickhouse";
import { logger } from "../lib/logger";

export const analyticsRoutes = new Hono();

// GET /v1/analytics/usage
analyticsRoutes.get("/usage", async (c) => {
  const orgId = c.get("orgId");
  const from = c.req.query("from") || new Date(Date.now() - 30 * 86400000).toISOString();
  const to = c.req.query("to") || new Date().toISOString();
  const projectId = c.req.query("project_id");
  const model = c.req.query("model");

  let query = `
    SELECT
      toDate(timestamp) as date,
      provider,
      model,
      sum(input_tokens) as total_input_tokens,
      sum(output_tokens) as total_output_tokens,
      sum(total_tokens) as total_tokens,
      sum(cost_usd) as total_cost,
      avg(latency_ms) as avg_latency,
      count() as request_count,
      countIf(cached = 1) as cache_hits
    FROM requests
    WHERE org_id = {orgId:String}
      AND timestamp >= parseDateTimeBestEffort({from:String})
      AND timestamp <= parseDateTimeBestEffort({to:String})
  `;

  if (projectId) query += ` AND project_id = {projectId:String}`;
  if (model) query += ` AND model = {model:String}`;

  query += ` GROUP BY date, provider, model ORDER BY date DESC`;

  try {
    const result = await getClickHouse().query({
      query,
      query_params: { orgId, from, to, projectId: projectId || "", model: model || "" },
      format: "JSONEachRow",
    });
    const data = await result.json();
    return c.json({ data, period: { from, to } });
  } catch (error: any) {
    logger.error("Analytics error", { error: error.message });
    return c.json({ error: "Failed to fetch analytics" }, 500);
  }
});

// GET /v1/analytics/savings
analyticsRoutes.get("/savings", async (c) => {
  const orgId = c.get("orgId");
  const from = c.req.query("from") || new Date(Date.now() - 30 * 86400000).toISOString();
  const to = c.req.query("to") || new Date().toISOString();

  try {
    const result = await getClickHouse().query({
      query: `
        SELECT
          sum(cost_usd) as actual_cost,
          sumIf(cost_usd, cached = 1) as cache_savings,
          count() as total_requests,
          countIf(cached = 1) as cached_requests,
          avg(latency_ms) as avg_latency
        FROM requests
        WHERE org_id = {orgId:String}
          AND timestamp >= parseDateTimeBestEffort({from:String})
          AND timestamp <= parseDateTimeBestEffort({to:String})
      `,
      query_params: { orgId, from, to },
      format: "JSONEachRow",
    });
    const data = await result.json();

    return c.json({
      savings: data[0] || {},
      period: { from, to },
    });
  } catch (error: any) {
    logger.error("Savings error", { error: error.message });
    return c.json({ error: "Failed to calculate savings" }, 500);
  }
});
