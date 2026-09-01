import { describe, it, expect } from "vitest";
import { estimate1RM, estimate1RMEpley } from "./one-rm";

describe("estimate1RM", () => {
  it("returns the weight itself for 1 rep", () => {
    const result = estimate1RM(100, 1);
    expect(result.epley).toBe(100);
    expect(result.brzycki).toBe(100);
    expect(result.lombardi).toBe(100);
    expect(result.average).toBe(100);
  });

  it("returns 0 for invalid inputs", () => {
    expect(estimate1RM(0, 10)).toEqual({ epley: 0, brzycki: 0, lombardi: 0, average: 0 });
    expect(estimate1RM(100, 0)).toEqual({ epley: 0, brzycki: 0, lombardi: 0, average: 0 });
    expect(estimate1RM(-10, 10)).toEqual({ epley: 0, brzycki: 0, lombardi: 0, average: 0 });
  });

  it("Epley formula: weight × (1 + reps/30)", () => {
    const result = estimate1RM(100, 10);
    // Epley: 100 × (1 + 10/30) = 100 × 1.333 = 133.33
    expect(result.epley).toBeCloseTo(133.33, 0);
  });

  it("Brzycki formula: weight × (36 / (37 - reps))", () => {
    const result = estimate1RM(100, 10);
    // Brzycki: 100 × (36 / 27) = 100 × 1.333 = 133.33
    expect(result.brzycki).toBeCloseTo(133.33, 0);
  });

  it("Lombardi formula: weight × reps^0.10", () => {
    const result = estimate1RM(100, 10);
    // Lombardi: 100 × 10^0.10 = 100 × 1.259 = 125.89
    expect(result.lombardi).toBeCloseTo(125.89, 0);
  });

  it("average is mean of three formulas", () => {
    const result = estimate1RM(100, 10);
    const expectedAverage = (result.epley + result.brzycki + result.lombardi) / 3;
    expect(result.average).toBeCloseTo(expectedAverage, 1);
  });

  it("all estimates are positive for valid inputs", () => {
    const result = estimate1RM(80, 8);
    expect(result.epley).toBeGreaterThan(0);
    expect(result.brzycki).toBeGreaterThan(0);
    expect(result.lombardi).toBeGreaterThan(0);
    expect(result.average).toBeGreaterThan(0);
  });

  it("1RM estimates increase as reps increase (same weight)", () => {
    const r5 = estimate1RM(100, 5);
    const r10 = estimate1RM(100, 10);
    const r15 = estimate1RM(100, 15);

    // More reps with same weight → higher estimated 1RM (you're stronger)
    expect(r5.average).toBeLessThan(r10.average);
    expect(r10.average).toBeLessThan(r15.average);
  });

  it("handles edge case: 2 reps", () => {
    const result = estimate1RM(100, 2);
    expect(result.epley).toBeGreaterThan(100);
    expect(result.brzycki).toBeGreaterThan(100);
  });
});

describe("estimate1RMEpley", () => {
  it("returns 0 for invalid inputs", () => {
    expect(estimate1RMEpley(0, 10)).toBe(0);
    expect(estimate1RMEpley(100, 0)).toBe(0);
  });

  it("returns weight for 1 rep", () => {
    expect(estimate1RMEpley(100, 1)).toBe(100);
  });

  it("matches epley formula result", () => {
    const full = estimate1RM(100, 10);
    const quick = estimate1RMEpley(100, 10);
    expect(quick).toBe(full.epley);
  });
});
