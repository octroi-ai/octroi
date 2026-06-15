import { describe, it, expect } from "vitest";
import { PROVIDER_CATALOG, providerDefinitionSchema, getSeedProvider, findModel } from "./providers";

describe("provider registry", () => {
  it("seed catalogue is non-empty and every entry is valid", () => {
    expect(PROVIDER_CATALOG.length).toBeGreaterThanOrEqual(10);
    for (const p of PROVIDER_CATALOG) {
      expect(() => providerDefinitionSchema.parse(p)).not.toThrow();
    }
  });

  it("provider ids are unique", () => {
    const ids = PROVIDER_CATALOG.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers open, closed, aggregator and self-hosted kinds", () => {
    const kinds = new Set(PROVIDER_CATALOG.map((p) => p.kind));
    expect(kinds).toContain("closed");
    expect(kinds).toContain("open");
    expect(kinds).toContain("aggregator");
    expect(kinds).toContain("self-hosted");
  });

  it("resolves a seed provider and its model pricing", () => {
    const openai = getSeedProvider("openai");
    expect(openai?.protocol).toBe("openai");
    expect(findModel(openai!, "gpt-4o")?.inputPer1k).toBeGreaterThan(0);
    expect(getSeedProvider("nope")).toBeUndefined();
  });

  it("rejects an invalid definition", () => {
    expect(() => providerDefinitionSchema.parse({ id: "x" })).toThrow();
  });

  it("applies defaults when adding a new provider as config", () => {
    const def = providerDefinitionSchema.parse({
      id: "custom-llm",
      name: "Custom",
      kind: "open",
      protocol: "openai",
      baseUrl: "https://api.example.com/v1",
      auth: { type: "bearer" },
    });
    expect(def.region).toBe("global");
    expect(def.enabled).toBe(true);
    expect(def.models).toEqual([]);
  });
});
