import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { randomBytes } from "crypto";
import { organizations, users, apiKeys } from "@tokenforge/db";
import { eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import { hashPassword, verifyPassword, generateApiKey, slugify } from "../lib/credentials";
import { seedStarterData } from "../lib/seed-org";
import { logger } from "../lib/logger";

// Public (unauthenticated) account endpoints. Mounted at /auth — NOT behind the
// API-key auth middleware. The returned apiKey IS the session credential the
// rest of the API expects in the X-Octroi-Key header.
export const authRoutes = new Hono();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  orgName: z.string().min(1).max(120).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRoutes.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, password, orgName } = c.req.valid("json");
  const db = getDb();
  try {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return c.json({ error: "Un compte existe déjà avec cet email." }, 409);
    }

    const displayName = orgName?.trim() || email.split("@")[0];
    const slug = `${slugify(displayName)}-${randomBytes(3).toString("hex")}`;

    const [org] = await db.insert(organizations).values({ name: displayName, slug }).returning();
    await db.insert(users).values({
      orgId: org.id,
      email,
      name: displayName,
      role: "owner",
      passwordHash: hashPassword(password),
    });

    const { key, keyHash, keyPrefix } = generateApiKey();
    await db.insert(apiKeys).values({ orgId: org.id, keyHash, keyPrefix, label: "Clé principale" });

    // Populate the new org with realistic starter data (best-effort).
    try {
      await seedStarterData(org.id);
    } catch (seedErr: any) {
      logger.error("Seed starter data failed", { error: seedErr.message });
    }

    return c.json({ apiKey: key, email, orgId: org.id, orgName: org.name }, 201);
  } catch (error: any) {
    logger.error("Register error", { error: error.message });
    return c.json({ error: "Inscription impossible. Réessaie." }, 500);
  }
});

authRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const db = getDb();
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return c.json({ error: "Email ou mot de passe incorrect." }, 401);
    }

    // Issue a fresh API key for this session (the key is the credential).
    const { key, keyHash, keyPrefix } = generateApiKey();
    await db.insert(apiKeys).values({ orgId: user.orgId, keyHash, keyPrefix, label: "Session" });

    const [org] = await db.select().from(organizations).where(eq(organizations.id, user.orgId)).limit(1);
    return c.json({ apiKey: key, email: user.email, orgId: user.orgId, orgName: org?.name });
  } catch (error: any) {
    logger.error("Login error", { error: error.message });
    return c.json({ error: "Connexion impossible. Réessaie." }, 500);
  }
});
