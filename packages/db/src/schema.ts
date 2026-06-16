import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── ENUMS ─────────────────────────────────────────
export const planEnum = pgEnum("plan", ["free", "pro", "business", "enterprise"]);
export const roleEnum = pgEnum("role", ["owner", "admin", "member", "viewer"]);
export const riskLevelEnum = pgEnum("risk_level", [
  "unacceptable",
  "high",
  "limited",
  "minimal",
  "not_assessed",
]);
export const complianceStatusEnum = pgEnum("compliance_status", [
  "compliant",
  "non_compliant",
  "review_needed",
  "not_assessed",
]);

// ─── ORGANISATIONS & AUTH ──────────────────────────
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  plan: planEnum("plan").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: roleEnum("role").notNull().default("member"),
  avatarUrl: text("avatar_url"),
  passwordHash: text("password_hash"),
  supabaseUserId: text("supabase_user_id").unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  keyHash: text("key_hash").notNull().unique(),
  keyPrefix: varchar("key_prefix", { length: 12 }).notNull(),
  label: text("label").notNull(),
  permissions: jsonb("permissions").$type<string[]>().default([]),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── TOKENOPS (CORE) ──────────────────────────────
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  budgetMonthly: real("budget_monthly"),
  alertThreshold: real("alert_threshold").default(0.8),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const requests = pgTable("requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 50 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  region: varchar("region", { length: 50 }),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  costUsd: real("cost_usd").notNull().default(0),
  latencyMs: integer("latency_ms"),
  cached: boolean("cached").notNull().default(false),
  statusCode: integer("status_code"),
  requestHash: text("request_hash"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const dailyAggregates = pgTable("daily_aggregates", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  totalTokens: integer("total_tokens").notNull().default(0),
  totalCostUsd: real("total_cost_usd").notNull().default(0),
  cacheHitRate: real("cache_hit_rate").default(0),
  avgLatencyMs: real("avg_latency_ms"),
  topModel: varchar("top_model", { length: 100 }),
  requestCount: integer("request_count").notNull().default(0),
});

// ─── ESG MODULE ───────────────────────────────────
export const carbonFootprints = pgTable("carbon_footprints", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  providerRegion: varchar("provider_region", { length: 50 }),
  gpuType: varchar("gpu_type", { length: 50 }),
  pue: real("pue").default(1.1),
  energyMixGco2Kwh: real("energy_mix_gco2_kwh"),
  energyWh: real("energy_wh"),
  co2Grams: real("co2_grams"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const greenCertificates = pgTable("green_certificates", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  totalTokens: integer("total_tokens").notNull(),
  totalCo2Kg: real("total_co2_kg").notNull(),
  avoidedCo2Kg: real("avoided_co2_kg"),
  certificateHash: text("certificate_hash").notNull().unique(),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const energyGridData = pgTable("energy_grid_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  region: varchar("region", { length: 50 }).notNull(),
  date: date("date").notNull(),
  gco2Kwh: real("gco2_kwh").notNull(),
  renewablePct: real("renewable_pct"),
  source: text("source"),
});

// ─── COMPLIANCE MODULE ───────────────────────────
export const aiSystems = pgTable("ai_systems", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  riskLevel: riskLevelEnum("risk_level").notNull().default("not_assessed"),
  modelsUsed: jsonb("models_used").$type<string[]>().default([]),
  purpose: text("purpose"),
  deployedAt: timestamp("deployed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const complianceChecks = pgTable("compliance_checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  systemId: uuid("system_id")
    .notNull()
    .references(() => aiSystems.id, { onDelete: "cascade" }),
  checkType: varchar("check_type", { length: 100 }).notNull(),
  status: complianceStatusEnum("status").notNull().default("not_assessed"),
  findings: jsonb("findings").$type<Record<string, unknown>>(),
  recommendations: jsonb("recommendations").$type<string[]>(),
  checkedAt: timestamp("checked_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  detailsJson: jsonb("details_json").$type<Record<string, unknown>>(),
  ip: varchar("ip", { length: 45 }),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// ─── BROKER MODULE ───────────────────────────────
export const providerConfigs = pgTable("provider_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 50 }).notNull(),
  apiKeyEnc: text("api_key_enc").notNull(),
  priority: integer("priority").notNull().default(0),
  maxBudgetMonthly: real("max_budget_monthly"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const routingRules = pgTable("routing_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  conditionsJson: jsonb("conditions_json").$type<Record<string, unknown>>().notNull(),
  targetProvider: varchar("target_provider", { length: 50 }).notNull(),
  targetModel: varchar("target_model", { length: 100 }).notNull(),
  fallbackProvider: varchar("fallback_provider", { length: 50 }),
  fallbackModel: varchar("fallback_model", { length: 100 }),
  priority: integer("priority").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const priceHistory = pgTable("price_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: varchar("provider", { length: 50 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  region: varchar("region", { length: 50 }),
  inputPricePer1k: real("input_price_per_1k").notNull(),
  outputPricePer1k: real("output_price_per_1k").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Data-driven provider registry — add/configure thousands of providers without code.
// orgId null = global catalogue entry; non-null = org-specific override.
export const providerCatalog = pgTable("provider_catalog", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }),
  providerId: varchar("provider_id", { length: 100 }).notNull(),
  definition: jsonb("definition").$type<Record<string, unknown>>().notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── RELATIONS ───────────────────────────────────
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  apiKeys: many(apiKeys),
  projects: many(projects),
  requests: many(requests),
  carbonFootprints: many(carbonFootprints),
  greenCertificates: many(greenCertificates),
  aiSystems: many(aiSystems),
  auditLogs: many(auditLogs),
  providerConfigs: many(providerConfigs),
  routingRules: many(routingRules),
}));

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.orgId],
    references: [organizations.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.orgId],
    references: [organizations.id],
  }),
  requests: many(requests),
  dailyAggregates: many(dailyAggregates),
}));

export const requestsRelations = relations(requests, ({ one }) => ({
  project: one(projects, {
    fields: [requests.projectId],
    references: [projects.id],
  }),
  organization: one(organizations, {
    fields: [requests.orgId],
    references: [organizations.id],
  }),
  carbonFootprint: one(carbonFootprints),
}));

export const carbonFootprintsRelations = relations(carbonFootprints, ({ one }) => ({
  request: one(requests, {
    fields: [carbonFootprints.requestId],
    references: [requests.id],
  }),
  organization: one(organizations, {
    fields: [carbonFootprints.orgId],
    references: [organizations.id],
  }),
}));

export const aiSystemsRelations = relations(aiSystems, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [aiSystems.orgId],
    references: [organizations.id],
  }),
  complianceChecks: many(complianceChecks),
}));

export const complianceChecksRelations = relations(complianceChecks, ({ one }) => ({
  system: one(aiSystems, {
    fields: [complianceChecks.systemId],
    references: [aiSystems.id],
  }),
}));
