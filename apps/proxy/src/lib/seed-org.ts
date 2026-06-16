import { projects, aiSystems, requests, carbonFootprints, complianceChecks } from "@tokenforge/db";
import { calculateCost } from "@tokenforge/shared";
import { calculateCarbonFootprint } from "@tokenforge/esg-engine";
import { runComplianceAudit } from "@tokenforge/compliance-engine";
import { getDb } from "./db";
import { logger } from "./logger";

const SAMPLE_SYSTEMS = [
  {
    name: "Assistant support client",
    description:
      "Chatbot conversationnel qui répond aux questions des clients en self-service, intégré au site web et à l'application mobile.",
    purpose: "customer support chatbot",
    riskLevel: "limited" as const,
    modelsUsed: ["gpt-4o"],
  },
  {
    name: "Scoring crédit",
    description:
      "Modèle d'aide à la décision pour évaluer le risque de crédit lors des demandes de prêt à la consommation.",
    purpose: "credit scoring for essential services",
    riskLevel: "high" as const,
    modelsUsed: ["claude-sonnet-4-5-20250929"],
  },
  {
    name: "Tri de candidatures",
    description:
      "Outil d'assistance au tri et au classement des CV reçus pour les offres d'emploi internes (employment recruitment screening).",
    purpose: "employment recruitment screening",
    riskLevel: "high" as const,
    modelsUsed: ["mistral-large-latest"],
  },
];

const SAMPLE_CALLS = [
  { provider: "openai", model: "gpt-4o", region: "eu-west-3" },
  { provider: "anthropic", model: "claude-sonnet-4-5-20250929", region: "us-east-1" },
  { provider: "mistral", model: "mistral-large-latest", region: "eu-west-3" },
  { provider: "google", model: "gemini-2.0-flash", region: "eu-west-1" },
  { provider: "groq", model: "llama-3.3-70b-versatile", region: "us-east-1" },
];

// Seed a brand-new org with realistic starter data so the dashboards aren't
// empty on first login. Batched (5 inserts) so it adds ~1s to registration.
export async function seedStarterData(orgId: string): Promise<void> {
  const db = getDb();

  const [project] = await db
    .insert(projects)
    .values({ orgId, name: "Production", description: "Projet par défaut" })
    .returning();

  // AI systems + compliance audits
  const systems = await db
    .insert(aiSystems)
    .values(
      SAMPLE_SYSTEMS.map((s) => ({
        orgId,
        name: s.name,
        description: s.description,
        purpose: s.purpose,
        riskLevel: s.riskLevel,
        modelsUsed: s.modelsUsed,
        deployedAt: new Date(),
      }))
    )
    .returning();

  const allChecks: any[] = [];
  for (const sys of systems) {
    const audit = await runComplianceAudit(sys as any);
    for (const ch of audit.checks) {
      allChecks.push({
        systemId: sys.id,
        checkType: ch.type,
        status: ch.status,
        findings: ch.findings,
        recommendations: ch.recommendations,
      });
    }
  }
  if (allChecks.length) await db.insert(complianceChecks).values(allChecks);

  // ~18 requests spread over the last 30 days
  const now = Date.now();
  const rows = Array.from({ length: 18 }, (_, i) => {
    const call = SAMPLE_CALLS[i % SAMPLE_CALLS.length];
    const inputTokens = 400 + ((i * 137) % 2600);
    const outputTokens = 200 + ((i * 89) % 1400);
    const cached = i % 5 === 0;
    const latencyMs = 320 + ((i * 53) % 900);
    const costUsd = cached ? 0 : calculateCost(call.provider, call.model, inputTokens, outputTokens);
    const daysAgo = Math.floor((i * 29) / 17);
    const timestamp = new Date(now - daysAgo * 86400000 - (i % 12) * 3600000);
    return { ...call, inputTokens, outputTokens, cached, latencyMs, costUsd, timestamp };
  });

  const insertedReqs = await db
    .insert(requests)
    .values(
      rows.map((r) => ({
        projectId: project.id,
        orgId,
        provider: r.provider,
        model: r.model,
        region: r.region,
        inputTokens: r.inputTokens,
        outputTokens: r.outputTokens,
        costUsd: r.costUsd,
        latencyMs: r.latencyMs,
        cached: r.cached,
        statusCode: 200,
        timestamp: r.timestamp,
      }))
    )
    .returning({ id: requests.id });

  const carbonValues: any[] = [];
  for (let i = 0; i < insertedReqs.length; i++) {
    const r = rows[i];
    const carbon = await calculateCarbonFootprint({
      provider: r.provider,
      model: r.model,
      region: r.region,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
    });
    carbonValues.push({
      requestId: insertedReqs[i].id,
      orgId,
      providerRegion: carbon.providerRegion,
      gpuType: carbon.gpuType,
      pue: carbon.pue,
      energyMixGco2Kwh: carbon.energyMixGco2Kwh,
      energyWh: carbon.energyWh,
      co2Grams: carbon.co2Grams,
    });
  }
  if (carbonValues.length) await db.insert(carbonFootprints).values(carbonValues);

  logger.info("Seeded starter data", { orgId, systems: systems.length, requests: rows.length });
}
