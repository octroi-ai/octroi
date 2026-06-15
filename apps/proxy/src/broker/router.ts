import { providerConfigs, routingRules, providerCatalog } from "@tokenforge/db";
import { eq, and } from "drizzle-orm";
import { getSeedProvider, findModel, type ProviderDefinition } from "@tokenforge/shared";
import { createDecipheriv } from "crypto";
import { getDb } from "../lib/db";
import { config } from "../config";
import { Errors } from "../lib/errors";
import { logger } from "../lib/logger";
import { getAdapter } from "./adapters";

interface RouteRequestOptions {
  orgId: string;
  format: "openai" | "anthropic";
  body: any;
}

interface RouteResult {
  response: any;
  provider: string;
  model: string;
  region: string;
  cost: number;
  usage: { input_tokens: number; output_tokens: number };
}

export async function routeRequest(options: RouteRequestOptions): Promise<RouteResult> {
  const { orgId, format, body } = options;
  const db = getDb();

  const rules = await db
    .select()
    .from(routingRules)
    .where(and(eq(routingRules.orgId, orgId), eq(routingRules.enabled, true)))
    .orderBy(routingRules.priority);

  const configs = await db
    .select()
    .from(providerConfigs)
    .where(and(eq(providerConfigs.orgId, orgId), eq(providerConfigs.enabled, true)));

  let targetProvider = format === "anthropic" ? "anthropic" : "openai";
  let targetModel = body.model || (format === "anthropic" ? "claude-sonnet-4-5-20250929" : "gpt-4o");

  for (const rule of rules) {
    if (matchesConditions(rule.conditionsJson as any, body)) {
      targetProvider = rule.targetProvider;
      targetModel = rule.targetModel;
      break;
    }
  }

  const def = await resolveProvider(orgId, targetProvider);
  const apiKey = getProviderApiKey(def, configs);
  if (def.auth.type !== "none" && !apiKey) {
    throw Errors.noApiKey(def.id);
  }

  const adapter = getAdapter(def.protocol);
  const { url, headers, payload } = adapter.buildRequest(def, targetModel, apiKey, body);

  const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
  if (!response.ok) {
    const errorText = await response.text();
    throw Errors.providerError(def.id, response.status, errorText);
  }
  const json = await response.json();

  const usage = adapter.extractUsage(json);
  const model = findModel(def, targetModel);
  const cost =
    (usage.input_tokens / 1000) * (model?.inputPer1k ?? 0) +
    (usage.output_tokens / 1000) * (model?.outputPer1k ?? 0);

  return { response: json, provider: def.id, model: targetModel, region: def.region, cost, usage };
}

// Resolve a provider definition: org-specific DB row > global DB row > seed catalogue.
async function resolveProvider(orgId: string, providerId: string): Promise<ProviderDefinition> {
  const db = getDb();
  const rows = await db.select().from(providerCatalog).where(eq(providerCatalog.providerId, providerId));
  const orgRow = rows.find((r) => r.orgId === orgId && r.enabled);
  const globalRow = rows.find((r) => r.orgId === null && r.enabled);
  const def = (orgRow?.definition ?? globalRow?.definition ?? getSeedProvider(providerId)) as
    | ProviderDefinition
    | undefined;
  if (!def) throw Errors.notFound(`provider '${providerId}'`);
  return def;
}

function matchesConditions(conditions: any, body: any): boolean {
  if (!conditions) return false;
  if (conditions.model && body.model !== conditions.model) return false;
  if (conditions.max_tokens && body.max_tokens > conditions.max_tokens) return false;
  return true;
}

function decryptApiKey(encryptedData: string): string {
  try {
    const [ivHex, authTagHex, encryptedHex] = encryptedData.split(":");
    if (!ivHex || !authTagHex || !encryptedHex) return encryptedData;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const key = Buffer.from(config.ENCRYPTION_KEY, "hex");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString("utf8");
  } catch (error) {
    logger.error("Failed to decrypt API key", { error: (error as Error).message });
    return "";
  }
}

function getProviderApiKey(def: ProviderDefinition, configs: any[]): string {
  if (def.auth.type === "none") return "";
  const providerConfig = configs.find((c) => c.provider === def.id);
  if (providerConfig) return decryptApiKey(providerConfig.apiKeyEnc);

  const envKeys: Record<string, string> = {
    openai: config.OPENAI_API_KEY || "",
    anthropic: config.ANTHROPIC_API_KEY || "",
    mistral: config.MISTRAL_API_KEY || "",
    google: config.GOOGLE_AI_KEY || "",
  };
  return envKeys[def.id] || "";
}
