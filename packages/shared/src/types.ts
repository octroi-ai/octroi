// ─── Organisation & Auth Types ─────────────────────
export type Plan = "free" | "pro" | "business" | "enterprise";
export type Role = "owner" | "admin" | "member" | "viewer";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  stripeCustomerId?: string;
  createdAt: Date;
}

export interface User {
  id: string;
  orgId: string;
  email: string;
  name?: string;
  role: Role;
  avatarUrl?: string;
}

export interface ApiKey {
  id: string;
  orgId: string;
  keyPrefix: string;
  label: string;
  permissions: string[];
  lastUsedAt?: Date;
  expiresAt?: Date;
}

// ─── TokenOps Types ────────────────────────────────
export interface TokenRequest {
  id: string;
  projectId: string;
  provider: string;
  model: string;
  region?: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs?: number;
  cached: boolean;
  timestamp: Date;
}

export interface UsageAggregate {
  date: string;
  provider: string;
  model: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
  requestCount: number;
  cacheHits: number;
}

export interface Project {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  budgetMonthly?: number;
  alertThreshold: number;
}

// ─── ESG Types ─────────────────────────────────────
export interface CarbonFootprint {
  id: string;
  requestId: string;
  providerRegion?: string;
  gpuType?: string;
  pue: number;
  energyMixGco2Kwh?: number;
  energyWh?: number;
  co2Grams?: number;
}

export interface GreenCertificate {
  id: string;
  orgId: string;
  periodStart: string;
  periodEnd: string;
  totalTokens: number;
  totalCo2Kg: number;
  avoidedCo2Kg?: number;
  certificateHash: string;
  verified: boolean;
}

export interface EsgFootprintSummary {
  co2Kg: number;
  energyKwh: number;
  avgPue: number;
  requestCount: number;
}

// ─── Compliance Types ──────────────────────────────
export type RiskLevel = "unacceptable" | "high" | "limited" | "minimal";
export type ComplianceStatus = "compliant" | "non_compliant" | "review_needed" | "not_assessed";

export interface AiSystem {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  riskLevel: RiskLevel;
  modelsUsed: string[];
  purpose?: string;
  deployedAt?: Date;
}

export interface ComplianceCheck {
  id: string;
  systemId: string;
  checkType: string;
  status: ComplianceStatus;
  findings?: Record<string, unknown>;
  recommendations?: string[];
  checkedAt: Date;
}

export interface ComplianceScore {
  score: number;
  totalSystems: number;
  compliantSystems: number;
  systems: SystemComplianceStatus[];
}

export interface SystemComplianceStatus {
  id: string;
  name: string;
  riskLevel: RiskLevel;
  totalChecks: number;
  compliant: number;
  nonCompliant: number;
  reviewNeeded: number;
}

// ─── Broker Types ──────────────────────────────────
export type ProviderName = "openai" | "anthropic" | "mistral" | "google" | "cohere";

export interface ProviderConfig {
  id: string;
  orgId: string;
  provider: ProviderName;
  priority: number;
  maxBudgetMonthly?: number;
  enabled: boolean;
}

export interface RoutingRule {
  id: string;
  orgId: string;
  name: string;
  conditions: Record<string, unknown>;
  targetProvider: string;
  targetModel: string;
  fallbackProvider?: string;
  fallbackModel?: string;
  priority: number;
  enabled: boolean;
}

export interface PriceInfo {
  provider: string;
  model: string;
  region?: string;
  inputPricePer1k: number;
  outputPricePer1k: number;
  updatedAt: Date;
}

// ─── API Response Types ────────────────────────────
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface OctroiMetadata {
  cached: boolean;
  provider?: string;
  model?: string;
  region?: string;
  latency_ms: number;
  cost_usd?: number;
  input_tokens?: number;
  output_tokens?: number;
}
