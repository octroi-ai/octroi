import type { ProviderDefinition } from "@tokenforge/shared";

export interface BuiltRequest {
  url: string;
  headers: Record<string, string>;
  payload: unknown;
}
export interface Usage {
  input_tokens: number;
  output_tokens: number;
}
export interface ProtocolAdapter {
  buildRequest(def: ProviderDefinition, model: string, apiKey: string, body: any): BuiltRequest;
  extractUsage(response: any): Usage;
}

function baseHeaders(def: ProviderDefinition, apiKey: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json", ...(def.headers ?? {}) };
  if (def.auth.type === "bearer") h["Authorization"] = `${def.auth.prefix ?? "Bearer "}${apiKey}`;
  else if (def.auth.type === "header" && def.auth.header) h[def.auth.header] = apiKey;
  return h;
}

const trimBase = (u: string) => u.replace(/\/$/, "");

// OpenAI protocol — covers OpenAI, Mistral, Groq, Together, Fireworks, OpenRouter,
// DeepSeek, xAI, Perplexity, Azure, Ollama, vLLM and any OpenAI-compatible endpoint.
const openai: ProtocolAdapter = {
  buildRequest(def, model, apiKey, body) {
    return {
      url: trimBase(def.baseUrl) + (def.chatPath ?? "/chat/completions"),
      headers: baseHeaders(def, apiKey),
      payload: { ...body, model },
    };
  },
  extractUsage(r) {
    return { input_tokens: r?.usage?.prompt_tokens ?? 0, output_tokens: r?.usage?.completion_tokens ?? 0 };
  },
};

const anthropic: ProtocolAdapter = {
  buildRequest(def, model, apiKey, body) {
    return {
      url: trimBase(def.baseUrl) + (def.chatPath ?? "/messages"),
      headers: baseHeaders(def, apiKey),
      payload: { model, max_tokens: body.max_tokens ?? 1024, messages: body.messages, ...(body.system ? { system: body.system } : {}) },
    };
  },
  extractUsage(r) {
    return { input_tokens: r?.usage?.input_tokens ?? 0, output_tokens: r?.usage?.output_tokens ?? 0 };
  },
};

const google: ProtocolAdapter = {
  buildRequest(def, model, apiKey, body) {
    const q = def.auth.type === "query" ? `?${def.auth.queryParam ?? "key"}=${apiKey}` : "";
    const contents = (body.messages ?? []).map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }],
    }));
    return {
      url: `${trimBase(def.baseUrl)}/models/${model}:generateContent${q}`,
      headers: { "Content-Type": "application/json", ...(def.headers ?? {}) },
      payload: { contents },
    };
  },
  extractUsage(r) {
    return {
      input_tokens: r?.usageMetadata?.promptTokenCount ?? 0,
      output_tokens: r?.usageMetadata?.candidatesTokenCount ?? 0,
    };
  },
};

const cohere: ProtocolAdapter = {
  buildRequest(def, model, apiKey, body) {
    return {
      url: trimBase(def.baseUrl) + (def.chatPath ?? "/chat"),
      headers: baseHeaders(def, apiKey),
      payload: { model, messages: body.messages },
    };
  },
  extractUsage(r) {
    const t = r?.usage?.tokens ?? r?.meta?.tokens ?? {};
    return { input_tokens: t.input_tokens ?? 0, output_tokens: t.output_tokens ?? 0 };
  },
};

export const ADAPTERS: Record<string, ProtocolAdapter> = {
  openai,
  anthropic,
  google,
  cohere,
  custom: openai, // generic OpenAI-compatible fallback
};

export function getAdapter(protocol: string): ProtocolAdapter {
  return ADAPTERS[protocol] ?? ADAPTERS.custom;
}
