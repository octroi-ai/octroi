import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),
  PROXY_PORT: z.coerce.number().default(8787),

  // Database
  DATABASE_URL: z.string().startsWith("postgresql://"),

  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // ClickHouse
  CLICKHOUSE_URL: z.string().url().default("http://localhost:8123"),
  CLICKHOUSE_DB: z.string().default("tokenforge"),
  CLICKHOUSE_USER: z.string().default("default"),
  CLICKHOUSE_PASSWORD: z.string().optional(),

  // Security
  ENCRYPTION_KEY: z.string().min(32),
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),

  // Provider API keys (optional — orgs can configure their own)
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),
  GOOGLE_AI_KEY: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

function loadConfig() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment configuration:");
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }
  return {
    ...parsed.data,
    // Honour the platform-provided PORT (Render, Heroku, etc.); fall back to PROXY_PORT.
    PROXY_PORT: process.env.PORT ? Number(process.env.PORT) : parsed.data.PROXY_PORT,
    isProd: parsed.data.NODE_ENV === "production",
    allowedOrigins: parsed.data.ALLOWED_ORIGINS.split(",").map((s) => s.trim()),
  };
}

export const config = loadConfig();
export type Config = typeof config;
