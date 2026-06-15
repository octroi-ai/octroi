import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { routingRules, priceHistory, providerCatalog } from "@tokenforge/db";
import { eq, desc, and, isNull } from "drizzle-orm";
import { PROVIDER_CATALOG, providerDefinitionSchema, type ProviderDefinition } from "@tokenforge/shared";
import { getDb } from "../lib/db";
import { logger } from "../lib/logger";

export const brokerRoutes = new Hono();

// ── Merge seed catalogue + global DB rows + org-specific DB rows ──
function mergeCatalog(rows: { orgId: string | null; providerId: string; definition: unknown; enabled: boolean }[], orgId: string) {
  const map = new Map<string, ProviderDefinition>();
  for (const p of PROVIDER_CATALOG) map.set(p.id, p);
  for (const r of rows.filter((r) => r.orgId === null)) map.set(r.providerId, r.definition as ProviderDefinition);
  for (const r of rows.filter((r) => r.orgId === orgId)) map.set(r.providerId, r.definition as ProviderDefinition);
  return Array.from(map.values());
}

// GET /v1/broker/providers — full configurable catalogue (seed + DB). ?full=1 for definitions.
brokerRoutes.get("/providers", async (c) => {
  const orgId = c.get("orgId");
  try {
    const rows = await getDb().select().from(providerCatalog);
    const merged = mergeCatalog(rows as any, orgId);
    const full = c.req.query("full") === "1";
    const providers = full
      ? merged
      : merged.map((d) => ({ id: d.id, name: d.name, kind: d.kind, protocol: d.protocol, region: d.region, enabled: d.enabled, models: d.models.length }));
    return c.json({ providers, count: providers.length });
  } catch (error: any) {
    logger.error("List providers error", { error: error.message });
    return c.json({ error: "Failed to list providers" }, 500);
  }
});

// POST /v1/broker/providers — add or reconfigure a provider (data-driven, no code).
// ?scope=global stores a global catalogue entry; otherwise org-specific.
brokerRoutes.post("/providers", zValidator("json", providerDefinitionSchema), async (c) => {
  const orgId = c.get("orgId");
  const def = c.req.valid("json");
  const scopeGlobal = c.req.query("scope") === "global";
  const targetOrg = scopeGlobal ? null : orgId;

  try {
    const db = getDb();
    const existing = await db
      .select()
      .from(providerCatalog)
      .where(
        and(
          eq(providerCatalog.providerId, def.id),
          targetOrg ? eq(providerCatalog.orgId, targetOrg) : isNull(providerCatalog.orgId)
        )
      );

    if (existing.length > 0) {
      await db
        .update(providerCatalog)
        .set({ definition: def, enabled: def.enabled, updatedAt: new Date() })
        .where(eq(providerCatalog.id, existing[0].id));
    } else {
      await db.insert(providerCatalog).values({
        orgId: targetOrg,
        providerId: def.id,
        definition: def,
        enabled: def.enabled,
      });
    }
    return c.json({ provider: def, scope: scopeGlobal ? "global" : "org" }, 201);
  } catch (error: any) {
    logger.error("Upsert provider error", { error: error.message });
    return c.json({ error: "Failed to save provider" }, 500);
  }
});

// GET /v1/broker/prices
brokerRoutes.get("/prices", async (c) => {
  try {
    const prices = await getDb().select().from(priceHistory).orderBy(desc(priceHistory.timestamp)).limit(100);
    const latest = new Map<string, (typeof prices)[0]>();
    for (const price of prices) {
      const key = `${price.provider}:${price.model}:${price.region || "global"}`;
      if (!latest.has(key)) latest.set(key, price);
    }
    const result = Array.from(latest.values()).map((p) => ({
      provider: p.provider,
      model: p.model,
      region: p.region,
      input_price_per_1k: p.inputPricePer1k,
      output_price_per_1k: p.outputPricePer1k,
      updated_at: p.timestamp,
    }));
    return c.json({ prices: result });
  } catch (error: any) {
    logger.error("Broker prices error", { error: error.message });
    return c.json({ error: "Failed to fetch prices" }, 500);
  }
});

const rulesSchema = z.object({
  rules: z.array(
    z.object({
      name: z.string().min(1).max(100),
      conditions: z.record(z.unknown()),
      target_provider: z.string(),
      target_model: z.string(),
      fallback_provider: z.string().optional(),
      fallback_model: z.string().optional(),
      priority: z.number().int().min(0).optional(),
      enabled: z.boolean().optional(),
    })
  ),
});

// PUT /v1/broker/rules
brokerRoutes.put("/rules", zValidator("json", rulesSchema), async (c) => {
  const orgId = c.get("orgId");
  const { rules } = c.req.valid("json");
  try {
    const db = getDb();
    await db.delete(routingRules).where(eq(routingRules.orgId, orgId));
    if (rules.length > 0) {
      const inserted = await db
        .insert(routingRules)
        .values(
          rules.map((rule, idx) => ({
            orgId,
            name: rule.name,
            conditionsJson: rule.conditions,
            targetProvider: rule.target_provider,
            targetModel: rule.target_model,
            fallbackProvider: rule.fallback_provider,
            fallbackModel: rule.fallback_model,
            priority: rule.priority ?? idx,
            enabled: rule.enabled ?? true,
          }))
        )
        .returning();
      return c.json({ rules: inserted });
    }
    return c.json({ rules: [] });
  } catch (error: any) {
    logger.error("Broker rules error", { error: error.message });
    return c.json({ error: "Failed to update rules" }, 500);
  }
});
