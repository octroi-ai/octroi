import { z } from "zod";

// ── Provider registry: data-driven, extensible to thousands ──
// A provider is pure DATA (no code). Add one = append a catalog entry or insert a
// `provider_catalog` DB row. A handful of protocol adapters cover almost everything:
// most open/closed providers (Groq, Together, Fireworks, OpenRouter, DeepSeek, xAI,
// Perplexity, Ollama, vLLM, Azure…) speak the OpenAI protocol.

export const providerModelSchema = z.object({
  id: z.string(),
  inputPer1k: z.number().nonnegative(),
  outputPer1k: z.number().nonnegative(),
  context: z.number().int().positive().optional(),
});
export type ProviderModel = z.infer<typeof providerModelSchema>;

export const providerAuthSchema = z.object({
  type: z.enum(["bearer", "header", "query", "none"]),
  header: z.string().optional(),
  prefix: z.string().optional(),
  queryParam: z.string().optional(),
});
export type ProviderAuth = z.infer<typeof providerAuthSchema>;

export const PROVIDER_PROTOCOLS = ["openai", "anthropic", "google", "cohere", "custom"] as const;
export const PROVIDER_KINDS = ["closed", "open", "self-hosted", "aggregator"] as const;

export const providerDefinitionSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1),
  kind: z.enum(PROVIDER_KINDS),
  protocol: z.enum(PROVIDER_PROTOCOLS),
  baseUrl: z.string().url(),
  chatPath: z.string().optional(),
  auth: providerAuthSchema,
  region: z.string().default("global"),
  headers: z.record(z.string()).optional(),
  enabled: z.boolean().default(true),
  models: z.array(providerModelSchema).default([]),
});
export type ProviderDefinition = z.infer<typeof providerDefinitionSchema>;

const bearer: ProviderAuth = { type: "bearer" };
const none: ProviderAuth = { type: "none" };

// Seed catalogue — a representative spread (closed / open / aggregator / self-hosted).
// Extend freely: append here, or POST to /v1/broker/providers to store in the DB.
export const PROVIDER_CATALOG: ProviderDefinition[] = [
  {
    id: "openai", name: "OpenAI", kind: "closed", protocol: "openai", region: "us",
    baseUrl: "https://api.openai.com/v1", auth: bearer, enabled: true,
    models: [
      { id: "gpt-4o", inputPer1k: 0.0025, outputPer1k: 0.01, context: 128000 },
      { id: "gpt-4o-mini", inputPer1k: 0.00015, outputPer1k: 0.0006, context: 128000 },
      { id: "o3-mini", inputPer1k: 0.0011, outputPer1k: 0.0044, context: 200000 },
    ],
  },
  {
    id: "anthropic", name: "Anthropic", kind: "closed", protocol: "anthropic", region: "us",
    baseUrl: "https://api.anthropic.com/v1", chatPath: "/messages",
    auth: { type: "header", header: "x-api-key" }, headers: { "anthropic-version": "2023-06-01" }, enabled: true,
    models: [
      { id: "claude-opus-4-6", inputPer1k: 0.015, outputPer1k: 0.075, context: 200000 },
      { id: "claude-sonnet-4-5-20250929", inputPer1k: 0.003, outputPer1k: 0.015, context: 200000 },
      { id: "claude-haiku-4-5-20251001", inputPer1k: 0.0008, outputPer1k: 0.004, context: 200000 },
    ],
  },
  {
    id: "google", name: "Google Gemini", kind: "closed", protocol: "google", region: "global",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    auth: { type: "query", queryParam: "key" }, enabled: true,
    models: [
      { id: "gemini-2.0-flash", inputPer1k: 0.0001, outputPer1k: 0.0004, context: 1000000 },
      { id: "gemini-2.0-pro", inputPer1k: 0.00125, outputPer1k: 0.005, context: 2000000 },
    ],
  },
  {
    id: "mistral", name: "Mistral", kind: "open", protocol: "openai", region: "eu",
    baseUrl: "https://api.mistral.ai/v1", auth: bearer, enabled: true,
    models: [
      { id: "mistral-large-latest", inputPer1k: 0.002, outputPer1k: 0.006, context: 128000 },
      { id: "mistral-small-latest", inputPer1k: 0.0002, outputPer1k: 0.0006, context: 32000 },
      { id: "codestral-latest", inputPer1k: 0.0003, outputPer1k: 0.0009, context: 32000 },
    ],
  },
  {
    id: "cohere", name: "Cohere", kind: "closed", protocol: "cohere", region: "us",
    baseUrl: "https://api.cohere.com/v2", chatPath: "/chat", auth: bearer, enabled: true,
    models: [
      { id: "command-r-plus", inputPer1k: 0.0025, outputPer1k: 0.01, context: 128000 },
      { id: "command-r", inputPer1k: 0.00015, outputPer1k: 0.0006, context: 128000 },
    ],
  },
  {
    id: "groq", name: "Groq", kind: "aggregator", protocol: "openai", region: "us",
    baseUrl: "https://api.groq.com/openai/v1", auth: bearer, enabled: true,
    models: [
      { id: "llama-3.3-70b-versatile", inputPer1k: 0.00059, outputPer1k: 0.00079, context: 128000 },
      { id: "llama-3.1-8b-instant", inputPer1k: 0.00005, outputPer1k: 0.00008, context: 128000 },
    ],
  },
  {
    id: "together", name: "Together AI", kind: "aggregator", protocol: "openai", region: "us",
    baseUrl: "https://api.together.xyz/v1", auth: bearer, enabled: true,
    models: [
      { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", inputPer1k: 0.00088, outputPer1k: 0.00088, context: 128000 },
      { id: "Qwen/Qwen2.5-72B-Instruct-Turbo", inputPer1k: 0.0012, outputPer1k: 0.0012, context: 32000 },
    ],
  },
  {
    id: "fireworks", name: "Fireworks AI", kind: "aggregator", protocol: "openai", region: "us",
    baseUrl: "https://api.fireworks.ai/inference/v1", auth: bearer, enabled: true,
    models: [{ id: "accounts/fireworks/models/llama-v3p3-70b-instruct", inputPer1k: 0.0009, outputPer1k: 0.0009, context: 128000 }],
  },
  {
    id: "openrouter", name: "OpenRouter", kind: "aggregator", protocol: "openai", region: "global",
    baseUrl: "https://openrouter.ai/api/v1", auth: bearer, enabled: true,
    models: [{ id: "meta-llama/llama-3.3-70b-instruct", inputPer1k: 0.0004, outputPer1k: 0.0004, context: 128000 }],
  },
  {
    id: "deepseek", name: "DeepSeek", kind: "open", protocol: "openai", region: "cn",
    baseUrl: "https://api.deepseek.com/v1", auth: bearer, enabled: true,
    models: [
      { id: "deepseek-chat", inputPer1k: 0.00027, outputPer1k: 0.0011, context: 64000 },
      { id: "deepseek-reasoner", inputPer1k: 0.00055, outputPer1k: 0.00219, context: 64000 },
    ],
  },
  {
    id: "xai", name: "xAI Grok", kind: "closed", protocol: "openai", region: "us",
    baseUrl: "https://api.x.ai/v1", auth: bearer, enabled: true,
    models: [{ id: "grok-2-latest", inputPer1k: 0.002, outputPer1k: 0.01, context: 131072 }],
  },
  {
    id: "perplexity", name: "Perplexity", kind: "closed", protocol: "openai", region: "us",
    baseUrl: "https://api.perplexity.ai", auth: bearer, enabled: true,
    models: [{ id: "sonar", inputPer1k: 0.001, outputPer1k: 0.001, context: 128000 }],
  },
  {
    id: "azure-openai", name: "Azure OpenAI", kind: "closed", protocol: "openai", region: "eu",
    baseUrl: "https://YOUR-RESOURCE.openai.azure.com/openai/deployments",
    auth: { type: "header", header: "api-key" }, enabled: false,
    models: [{ id: "gpt-4o", inputPer1k: 0.0025, outputPer1k: 0.01, context: 128000 }],
  },
  {
    id: "ollama", name: "Ollama (self-hosted)", kind: "self-hosted", protocol: "openai", region: "local",
    baseUrl: "http://localhost:11434/v1", auth: none, enabled: false,
    models: [{ id: "llama3.3", inputPer1k: 0, outputPer1k: 0, context: 128000 }],
  },
  {
    id: "vllm", name: "vLLM (self-hosted)", kind: "self-hosted", protocol: "openai", region: "local",
    baseUrl: "http://localhost:8000/v1", auth: none, enabled: false,
    models: [{ id: "default", inputPer1k: 0, outputPer1k: 0 }],
  },
];

export function getSeedProvider(id: string): ProviderDefinition | undefined {
  return PROVIDER_CATALOG.find((p) => p.id === id);
}

export function findModel(def: ProviderDefinition, modelId: string): ProviderModel | undefined {
  return def.models.find((m) => m.id === modelId);
}
