import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { greenCertificates, carbonFootprints } from "@tokenforge/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { createHash } from "crypto";
import { getDb } from "../lib/db";
import { logger } from "../lib/logger";

export const esgRoutes = new Hono();

// GET /v1/esg/footprint
esgRoutes.get("/footprint", async (c) => {
  const orgId = c.get("orgId");
  const from = c.req.query("from") || new Date(Date.now() - 30 * 86400000).toISOString();
  const to = c.req.query("to") || new Date().toISOString();

  try {
    const footprint = await getDb()
      .select({
        totalCo2Grams: sql<number>`sum(${carbonFootprints.co2Grams})`,
        totalEnergyWh: sql<number>`sum(${carbonFootprints.energyWh})`,
        avgPue: sql<number>`avg(${carbonFootprints.pue})`,
        requestCount: sql<number>`count(*)`,
      })
      .from(carbonFootprints)
      .where(
        and(
          eq(carbonFootprints.orgId, orgId),
          gte(carbonFootprints.createdAt, new Date(from)),
          lte(carbonFootprints.createdAt, new Date(to))
        )
      );

    const result = footprint[0] || {
      totalCo2Grams: 0,
      totalEnergyWh: 0,
      avgPue: 0,
      requestCount: 0,
    };

    return c.json({
      footprint: {
        co2_kg: (result.totalCo2Grams || 0) / 1000,
        energy_kwh: (result.totalEnergyWh || 0) / 1000,
        avg_pue: result.avgPue || 0,
        request_count: result.requestCount || 0,
      },
      period: { from, to },
    });
  } catch (error: any) {
    logger.error("ESG footprint error", { error: error.message });
    return c.json({ error: "Failed to calculate footprint" }, 500);
  }
});

const certificateSchema = z.object({
  period_start: z.string().datetime(),
  period_end: z.string().datetime(),
});

// POST /v1/esg/certificate
esgRoutes.post("/certificate", zValidator("json", certificateSchema), async (c) => {
  const orgId = c.get("orgId");
  const { period_start, period_end } = c.req.valid("json");

  try {
    const db = getDb();
    const totals = await db
      .select({
        totalCo2Grams: sql<number>`sum(${carbonFootprints.co2Grams})`,
        totalTokens: sql<number>`count(*)`,
      })
      .from(carbonFootprints)
      .where(
        and(
          eq(carbonFootprints.orgId, orgId),
          gte(carbonFootprints.createdAt, new Date(period_start)),
          lte(carbonFootprints.createdAt, new Date(period_end))
        )
      );

    const result = totals[0] || { totalCo2Grams: 0, totalTokens: 0 };
    const totalCo2Kg = (result.totalCo2Grams || 0) / 1000;

    const marketAvgCo2PerToken = 0.0001;
    const avoidedCo2Kg = (result.totalTokens || 0) * marketAvgCo2PerToken - totalCo2Kg;

    const certData = `${orgId}:${period_start}:${period_end}:${totalCo2Kg}:${Date.now()}`;
    const certificateHash = createHash("sha256").update(certData).digest("hex");

    const [certificate] = await db
      .insert(greenCertificates)
      .values({
        orgId,
        periodStart: period_start,
        periodEnd: period_end,
        totalTokens: result.totalTokens || 0,
        totalCo2Kg,
        avoidedCo2Kg: Math.max(0, avoidedCo2Kg),
        certificateHash,
        verified: true,
      })
      .returning();

    return c.json({ certificate }, 201);
  } catch (error: any) {
    logger.error("Certificate error", { error: error.message });
    return c.json({ error: "Failed to generate certificate" }, 500);
  }
});
