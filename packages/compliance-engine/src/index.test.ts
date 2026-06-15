import { describe, it, expect } from "vitest";
import { assessRiskLevel, runComplianceAudit } from "./index";

const base = { id: "1", name: "System", riskLevel: "", modelsUsed: ["gpt-4o"] as string[] };

describe("compliance-engine — EU AI Act risk classification", () => {
  it("flags unacceptable purposes", () => {
    expect(assessRiskLevel({ ...base, purpose: "social scoring of citizens" })).toBe("unacceptable");
  });
  it("flags high-risk purposes", () => {
    expect(assessRiskLevel({ ...base, purpose: "credit scoring for essential services" })).toBe("high");
  });
  it("flags limited-risk (chatbot)", () => {
    expect(assessRiskLevel({ ...base, purpose: "a customer support chatbot" })).toBe("limited");
  });
  it("defaults to minimal", () => {
    expect(assessRiskLevel({ ...base, purpose: "internal cost dashboards" })).toBe("minimal");
  });
});

describe("compliance-engine — audit", () => {
  it("returns checks and a coherent overall status", async () => {
    const r = await runComplianceAudit({ ...base, description: "short", purpose: "" });
    expect(r.checks.length).toBeGreaterThan(0);
    expect(["compliant", "non_compliant", "review_needed"]).toContain(r.overallStatus);
    expect(r.riskLevel).toBeTruthy();
  });

  it("adds extra risk-management check for high-risk systems", async () => {
    const r = await runComplianceAudit({ ...base, description: "A".repeat(80), purpose: "law enforcement biometric identification" });
    expect(r.riskLevel).toBe("high");
    expect(r.checks.some((c) => c.type === "risk_management_article_9")).toBe(true);
  });
});
