import { describe, it, expect } from "vitest";
import { calculateCarbonFootprint, estimateAvoidedEmissions } from "./index";

describe("esg-engine", () => {
  it("computes positive energy and CO2 for an inference", async () => {
    const r = await calculateCarbonFootprint({
      provider: "openai",
      model: "gpt-4o",
      region: "eu-west-3",
      inputTokens: 1000,
      outputTokens: 1000,
    });
    expect(r.energyWh).toBeGreaterThan(0);
    expect(r.co2Grams).toBeGreaterThan(0);
    expect(r.gpuType).toBe("H100");
    expect(r.pue).toBeGreaterThanOrEqual(1);
  });

  it("uses the regional carbon intensity (FR is low-carbon)", async () => {
    const fr = await calculateCarbonFootprint({
      provider: "openai",
      model: "gpt-4o",
      region: "eu-west-3", // → FR
      inputTokens: 5000,
      outputTokens: 5000,
    });
    expect(fr.energyMixGco2Kwh).toBeLessThan(100);
  });

  it("scales CO2 with token volume", async () => {
    const small = await calculateCarbonFootprint({ provider: "openai", model: "gpt-4o", region: "eu-west-3", inputTokens: 100, outputTokens: 100 });
    const big = await calculateCarbonFootprint({ provider: "openai", model: "gpt-4o", region: "eu-west-3", inputTokens: 10000, outputTokens: 10000 });
    expect(big.co2Grams).toBeGreaterThan(small.co2Grams);
  });

  it("avoided emissions are never negative", () => {
    expect(estimateAvoidedEmissions(999, 1000)).toBeGreaterThanOrEqual(0);
    expect(estimateAvoidedEmissions(0, 1000)).toBeGreaterThan(0);
  });
});
