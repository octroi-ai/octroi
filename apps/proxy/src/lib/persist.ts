import { requests, projects, carbonFootprints } from "@tokenforge/db";
import { eq } from "drizzle-orm";
import { calculateCarbonFootprint } from "@tokenforge/esg-engine";
import { getDb } from "./db";
import { getClickHouse, CLICKHOUSE_ENABLED } from "./clickhouse";
import { logger } from "./logger";

const projectCache = new Map<string, string>();

async function getDefaultProjectId(orgId: string): Promise<string> {
  const cached = projectCache.get(orgId);
  if (cached) return cached;
  const db = getDb();
  let [p] = await db.select({ id: projects.id }).from(projects).where(eq(projects.orgId, orgId)).limit(1);
  if (!p) {
    [p] = await db.insert(projects).values({ orgId, name: "Default" }).returning({ id: projects.id });
  }
  projectCache.set(orgId, p.id);
  return p.id;
}

export interface PersistInput {
  orgId: string;
  provider: string;
  model: string;
  region: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
  cached: boolean;
}

// Capture a routed request to PostgreSQL (requests + carbon_footprints) and
// ClickHouse (analytics). Fire-and-forget: never blocks or fails the response.
export async function persistRequest(p: PersistInput): Promise<void> {
  try {
    const db = getDb();
    const projectId = await getDefaultProjectId(p.orgId);
    const totalTokens = p.inputTokens + p.outputTokens;

    const [row] = await db
      .insert(requests)
      .values({
        projectId,
        orgId: p.orgId,
        provider: p.provider,
        model: p.model,
        region: p.region,
        inputTokens: p.inputTokens,
        outputTokens: p.outputTokens,
        costUsd: p.costUsd,
        latencyMs: p.latencyMs,
        cached: p.cached,
        statusCode: 200,
      })
      .returning({ id: requests.id });

    const carbon = await calculateCarbonFootprint({
      provider: p.provider,
      model: p.model,
      region: p.region,
      inputTokens: p.inputTokens,
      outputTokens: p.outputTokens,
    });

    await db.insert(carbonFootprints).values({
      requestId: row.id,
      orgId: p.orgId,
      providerRegion: carbon.providerRegion,
      gpuType: carbon.gpuType,
      pue: carbon.pue,
      energyMixGco2Kwh: carbon.energyMixGco2Kwh,
      energyWh: carbon.energyWh,
      co2Grams: carbon.co2Grams,
    });

    if (CLICKHOUSE_ENABLED) {
      await getClickHouse().insert({
        table: "requests",
        values: [
          {
            org_id: p.orgId,
            project_id: projectId,
            provider: p.provider,
            model: p.model,
            region: p.region,
            input_tokens: p.inputTokens,
            output_tokens: p.outputTokens,
            total_tokens: totalTokens,
            cost_usd: p.costUsd,
            latency_ms: p.latencyMs,
            cached: p.cached ? 1 : 0,
            status_code: 200,
          },
        ],
        format: "JSONEachRow",
      });
    }
  } catch (err) {
    logger.error("Persist request error", { error: (err as Error).message });
  }
}
