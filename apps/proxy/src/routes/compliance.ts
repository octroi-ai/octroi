import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { aiSystems, complianceChecks } from "@tokenforge/db";
import { eq, and, sql } from "drizzle-orm";
import { runComplianceAudit } from "@tokenforge/compliance-engine";
import { getDb } from "../lib/db";
import { Errors } from "../lib/errors";
import { logger } from "../lib/logger";

export const complianceRoutes = new Hono();

// GET /v1/compliance/status
complianceRoutes.get("/status", async (c) => {
  const orgId = c.get("orgId");

  try {
    const db = getDb();
    const systems = await db
      .select()
      .from(aiSystems)
      .where(eq(aiSystems.orgId, orgId));

    const checks = await db
      .select({
        systemId: complianceChecks.systemId,
        totalChecks: sql<number>`count(*)`,
        compliant: sql<number>`count(*) filter (where ${complianceChecks.status} = 'compliant')`,
        nonCompliant: sql<number>`count(*) filter (where ${complianceChecks.status} = 'non_compliant')`,
        reviewNeeded: sql<number>`count(*) filter (where ${complianceChecks.status} = 'review_needed')`,
      })
      .from(complianceChecks)
      .groupBy(complianceChecks.systemId);

    const checksMap = new Map(checks.map((ch) => [ch.systemId, ch]));

    const systemStatuses = systems.map((sys) => {
      const check = checksMap.get(sys.id);
      return {
        id: sys.id,
        name: sys.name,
        risk_level: sys.riskLevel,
        total_checks: check?.totalChecks || 0,
        compliant: check?.compliant || 0,
        non_compliant: check?.nonCompliant || 0,
        review_needed: check?.reviewNeeded || 0,
      };
    });

    const totalSystems = systems.length;
    const totalCompliant = systemStatuses.filter(
      (s) => s.non_compliant === 0 && s.review_needed === 0 && s.total_checks > 0
    ).length;

    return c.json({
      score: totalSystems > 0 ? Math.round((totalCompliant / totalSystems) * 100) : 0,
      total_systems: totalSystems,
      compliant_systems: totalCompliant,
      systems: systemStatuses,
    });
  } catch (error: any) {
    logger.error("Compliance status error", { error: error.message });
    return c.json({ error: "Failed to fetch compliance status" }, 500);
  }
});

const auditSchema = z.object({
  system_id: z.string().uuid(),
});

// POST /v1/compliance/audit
complianceRoutes.post("/audit", zValidator("json", auditSchema), async (c) => {
  const orgId = c.get("orgId");
  const { system_id } = c.req.valid("json");

  try {
    const db = getDb();
    const [system] = await db
      .select()
      .from(aiSystems)
      .where(and(eq(aiSystems.id, system_id), eq(aiSystems.orgId, orgId)))
      .limit(1);

    if (!system) {
      throw Errors.notFound("AI system");
    }

    const auditResult = await runComplianceAudit(system);

    const checkResults = await db
      .insert(complianceChecks)
      .values(
        auditResult.checks.map((check: any) => ({
          systemId: system_id,
          checkType: check.type,
          status: check.status,
          findings: check.findings,
          recommendations: check.recommendations,
        }))
      )
      .returning();

    return c.json({
      system_id,
      risk_level: auditResult.riskLevel,
      overall_status: auditResult.overallStatus,
      checks: checkResults,
      recommendations: auditResult.globalRecommendations,
    });
  } catch (error: any) {
    if (error.name === "AppError") throw error;
    logger.error("Audit error", { error: error.message });
    return c.json({ error: "Failed to run audit" }, 500);
  }
});
