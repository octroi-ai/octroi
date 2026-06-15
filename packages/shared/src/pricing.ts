// Provider pricing per 1K tokens (USD)
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

export function calculateCost(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = PROVIDER_PRICING[provider]?.[model];
  if (!pricing) return 0;
  return (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
}

export function findCheapestProvider(
  model_type: "large" | "medium" | "small",
  inputTokens: number,
  outputTokens: number
): { provider: string; model: string; cost: number } {
  const modelMap: Record<string, string[]> = {
    large: ["gpt-4o", "claude-sonnet-4-5-20250929", "mistral-large-latest", "gemini-2.0-pro", "command-r-plus"],
    medium: ["gpt-4o-mini", "claude-haiku-4-5-20251001", "mistral-small-latest", "gemini-2.0-flash", "command-r"],
    small: ["gpt-4o-mini", "claude-haiku-4-5-20251001", "mistral-small-latest", "gemini-1.5-flash", "command-light"],
  };

  const candidates = modelMap[model_type] || modelMap.medium;
  let cheapest = { provider: "", model: "", cost: Infinity };

  for (const [provider, models] of Object.entries(PROVIDER_PRICING)) {
    for (const [model, pricing] of Object.entries(models)) {
      if (candidates.includes(model)) {
        const cost = (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
        if (cost < cheapest.cost) {
          cheapest = { provider, model, cost };
        }
      }
    }
  }

  return cheapest;
}
