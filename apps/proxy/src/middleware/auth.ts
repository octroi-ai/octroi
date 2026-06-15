import type { Context, Next } from "hono";
import { apiKeys } from "@tokenforge/db";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { getDb } from "../lib/db";
import { Errors } from "../lib/errors";
import { logger } from "../lib/logger";

export async function authMiddleware(c: Context, next: Next) {
  const apiKey = c.req.header("X-Octroi-Key");

  if (!apiKey) {
    throw Errors.authMissing();
  }

  const keyHash = createHash("sha256").update(apiKey).digest("hex");

  try {
    const [key] = await getDb()
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1);

    if (!key) {
      throw Errors.authInvalid();
    }

    if (key.expiresAt && key.expiresAt < new Date()) {
      throw Errors.authExpired();
    }

    c.set("orgId", key.orgId);
    c.set("apiKeyId", key.id);
    c.set("permissions", key.permissions ?? []);

    await next();
  } catch (error) {
    if ((error as any).name === "AppError") throw error;
    logger.error("Auth error", { error: (error as Error).message });
    throw Errors.internal("Authentication failed");
  }
}
