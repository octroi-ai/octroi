import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { routeRequest } from "../broker/router";
import { checkCache, setCache } from "../cache/semantic-cache";
import { persistRequest } from "../lib/persist";
import { logger } from "../lib/logger";

export const proxyRoutes = new Hono();

const chatCompletionSchema = z.object({
  model: z.string().optional(),
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    })
  ),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
  stream: z.boolean().optional(),
});

const anthropicMessageSchema = z.object({
  model: z.string().optional(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  max_tokens: z.number().int().positive().default(1024),
  system: z.string().optional(),
});

// POST /v1/chat/completions — OpenAI-compatible proxy
proxyRoutes.post(
  "/chat/completions",
  zValidator("json", chatCompletionSchema),
  async (c) => {
    const orgId = c.get("orgId");
    const body = c.req.valid("json");
    const startTime = Date.now();

    // Check semantic cache
    const cacheKey = JSON.stringify({ model: body.model, messages: body.messages });
    const cached = await checkCache(cacheKey);
    if (cached) {
      return c.json({
        ...cached,
        _tokenforge: { cached: true, latency_ms: Date.now() - startTime },
      });
    }

    const result = await routeRequest({ orgId, format: "openai", body });
    const latencyMs = Date.now() - startTime;

    // Cache the response
    await setCache(cacheKey, result.response);

    // Capture the request — PostgreSQL + ClickHouse + carbon — non-blocking
    persistRequest({
      orgId,
      provider: result.provider,
      model: result.model,
      region: result.region,
      inputTokens: result.usage.input_tokens,
      outputTokens: result.usage.output_tokens,
      costUsd: result.cost,
      latencyMs,
      cached: false,
    }).catch((err) => logger.error("Persist error", { error: err.message }));

    return c.json({
      ...result.response,
      _tokenforge: {
        cached: false,
        provider: result.provider,
        model: result.model,
        region: result.region,
        latency_ms: latencyMs,
        cost_usd: result.cost,
        input_tokens: result.usage.input_tokens,
        output_tokens: result.usage.output_tokens,
      },
    });
  }
);

// POST /v1/messages — Anthropic-compatible proxy
proxyRoutes.post(
  "/messages",
  zValidator("json", anthropicMessageSchema),
  async (c) => {
    const orgId = c.get("orgId");
    const body = c.req.valid("json");
    const startTime = Date.now();

    const result = await routeRequest({ orgId, format: "anthropic", body });
    const latencyMs = Date.now() - startTime;

    persistRequest({
      orgId,
      provider: result.provider,
      model: result.model,
      region: result.region,
      inputTokens: result.usage.input_tokens,
      outputTokens: result.usage.output_tokens,
      costUsd: result.cost,
      latencyMs,
      cached: false,
    }).catch((err) => logger.error("Persist error", { error: err.message }));

    return c.json({
      ...result.response,
      _tokenforge: {
        cached: false,
        provider: result.provider,
        model: result.model,
        latency_ms: latencyMs,
        cost_usd: result.cost,
      },
    });
  }
);
