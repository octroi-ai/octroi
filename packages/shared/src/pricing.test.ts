import { describe, it, expect } from "vitest";
import { calculateCost, findCheapestProvider } from "./pricing";

describe("pricing", () => {
  it("computes cost from input/output tokens", () => {
    // gpt-4o: 0.0025 in / 0.01 out per 1k
    expect(calculateCost("openai", "gpt-4o", 1000, 1000)).toBeCloseTo(0.0125, 6);
    expect(calculateCost("openai", "gpt-4o", 2000, 0)).toBeCloseTo(0.005, 6);
  });

  it("returns 0 for unknown provider/model", () => {
    expect(calculateCost("openai", "does-not-exist", 1000, 1000)).toBe(0);
    expect(calculateCost("nope", "gpt-4o", 1000, 1000)).toBe(0);
  });

  it("finds the cheapest provider for a tier", () => {
    const r = findCheapestProvider("small", 1000, 1000);
    expect(r.provider).toBeTruthy();
    expect(r.cost).toBeGreaterThan(0);
    expect(r.cost).toBeLessThan(1);
  });
});
