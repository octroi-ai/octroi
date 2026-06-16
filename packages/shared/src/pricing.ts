import { PROVIDER_CATALOG, getSeedProvider, findModel } from "./providers";

// Legacy flat pricing table — kept only as a fallback for a few model ids that
// predate the provider catalogue (e.g. gpt-4-turbo, o1, command-light).
// The catalogue in providers.ts is the single source of truth for pricing.
export const PROVIDER_PRICING: Record<string, Record<string, { input: number; output: number }>> = {
  openai: {
    "gpt-4o": { input: 0.0025, output: 0.01 },
    "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
    "gpt-4-turbo": { input: 0.01, output: 0.03 },
    "o1": { input: 0.015, output: 0.06 },
    "o1-mini": { input: 0.003, output: 0.012 },
    "o3-mini": { input: 0.0011, output: 0.0044 },
  },
  anthropic: {
    "claude-opus-4-6": { input: 0.015, output: 0.075 },
    "claude-sonnet-4-5-20250929": { input: 0.003, output: 0.015 },
    "claude-haiku-4-5-20251001": { input: 0.0008, output: 0.004 },
  },
  mistral: {
    "mistral-large-latest": { input: 0.002, output: 0.006 },
    "mistral-medium-latest": { input: 0.0027, output: 0.0081 },
    "mistral-small-latest": { input: 0.0002, output: 0.0006 },
    "codestral-latest": { input: 0.0003, output: 0.0009 },
  },
  google: {
    "gemini-2.0-flash": { input: 0.0001, output: 0.0004 },
    "gemini-2.0-pro": { input: 0.00125, output: 0.005 },
    "gemini-1.5-flash": { input: 0.000075, output: 0.0003 },
  },
  cohere: {
    "command-r-plus": { input: 0.0025, output: 0.01 },
    "command-r": { input: 0.00015, output: 0.0006 },
    "command-light": { input: 0.0003, output: 0.0006 },
  },
};

// Resolve per-1k pricing for a provider/model, preferring the catalogue (which
// covers every registered provider — groq, together, deepseek, xai, …) and
// falling back to the legacy table. Returns undefined when truly unknown so the
// caller can decide (we return 0 cost rather than fabricate a price).
function lookupPricing(provider: string, model: string): { input: number; output: number } | undefined {
  const def = getSeedProvider(provider);
  const m = def ? findModel(def, model) : undefined;
  if (m) return { input: m.inputPer1k, output: m.outputPer1k };
  return PROVIDER_PRICING[provider]?.[model];
}

export function calculateCost(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = lookupPricing(provider, model);
  if (!pricing) return 0;
  return (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
}

export function findCheapestProvider(
  model_type: "large" | "medium" | "small",
  inputTokens: number,
  outputTokens: number
): { provider: string; model: string; cost: number } {
  // Candidate model ids per capability tier. Tiers span the whole catalogue —
  // including low-cost aggregators (Groq, DeepSeek, OpenRouter) — so "cheapest"
  // genuinely reflects the market, not just the five first-party providers.
  const modelMap: Record<string, string[]> = {
    large: [
      "gpt-4o", "claude-opus-4-6", "mistral-large-latest", "gemini-2.0-pro",
      "command-r-plus", "grok-2-latest", "deepseek-reasoner", "llama-3.3-70b-versatile",
    ],
    medium: [
      "gpt-4o-mini", "claude-haiku-4-5-20251001", "mistral-small-latest", "gemini-2.0-flash",
      "command-r", "deepseek-chat", "sonar", "meta-llama/llama-3.3-70b-instruct",
    ],
    small: [
      "gpt-4o-mini", "claude-haiku-4-5-20251001", "mistral-small-latest", "gemini-2.0-flash",
      "llama-3.1-8b-instant", "deepseek-chat",
    ],
  };

  const candidates = new Set(modelMap[model_type] || modelMap.medium);
  let cheapest = { provider: "", model: "", cost: Infinity };

  for (const def of PROVIDER_CATALOG) {
    if (def.enabled === false) continue; // skip disabled / unconfigured (azure, ollama, vllm)
    for (const m of def.models) {
      if (!candidates.has(m.id)) continue;
      const cost = (inputTokens / 1000) * m.inputPer1k + (outputTokens / 1000) * m.outputPer1k;
      if (cost < cheapest.cost) cheapest = { provider: def.id, model: m.id, cost };
    }
  }

  return cheapest;
}
