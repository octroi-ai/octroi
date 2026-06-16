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
  if (def.auth.type === "bearer") {
    // Normalise the prefix: a catalogue entry may set "Bearer" (no trailing
    // space) or "Bearer "; either must yield exactly one separating space.
    const prefix = def.auth.prefix ?? "Bearer";
    h["Authorization"] = prefix === "" || prefix.endsWith(" ") ? `${prefix}${apiKey}` : `${prefix} ${apiKey}`;
  } else if (def.auth.type === "header" && def.auth.header) {
    h[def.auth.header] = apiKey;
  }
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
    const messages = (body.messages ?? []) as any[];
    const textOf = (c: any) => (typeof c === "string" ? c : JSON.stringify(c));
    // Gemini expects the system prompt in `system_instruction`, not inline in
    // `contents`. Pull it out of body.system or any system-role messages.
    const systemParts = [
      ...(body.system ? [textOf(body.system)] : []),
      ...messages.filter((m) => m.role === "system").map((m) => textOf(m.content)),
    ].filter(Boolean);
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: textOf(m.content) }] }));
    return {
      url: `${trimBase(def.baseUrl)}/models/${model}:generateContent${q}`,
      headers: { "Content-Type": "application/json", ...(def.headers ?? {}) },
      payload: {
        contents,
        ...(systemParts.length ? { system_instruction: { parts: [{ text: systemParts.join("\n") }] } } : {}),
      },
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
    // Cohere v2 reports usage under usage.tokens or usage.billed_units
    // (and historically under meta.*). Accept all shapes so cost != 0.
    const t = r?.usage?.tokens ?? r?.usage?.billed_units ?? r?.meta?.tokens ?? r?.meta?.billed_units ?? {};
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
