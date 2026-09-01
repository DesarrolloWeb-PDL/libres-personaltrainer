import { describe, it, expect } from "vitest";
import { detectPlateau, calculateWeeklyAverages } from "./plateau";

describe("detectPlateau", () => {
  it("returns no plateau for empty data", () => {
    const result = detectPlateau([]);
    expect(result.isPlateau).toBe(false);
    expect(result.weeksSinceImprovement).toBe(0);
    expect(result.lastImprovementDate).toBeNull();
    expect(result.suggestion).toBeNull();
  });

  it("detects no plateau when data is improving", () => {
    const now = new Date();
    const data = [
      { date: new Date(now.getTime() - 14 * 86400000), value: 100 },
      { date: new Date(now.getTime() - 7 * 86400000), value: 105 },
      { date: now, value: 110 },
    ];

    const result = detectPlateau(data);
    expect(result.isPlateau).toBe(false);
    expect(result.currentValue).toBe(110);
    expect(result.peakValue).toBe(110);
  });

  it("detects plateau when no improvement for 14+ days", () => {
    const now = new Date();
    const data = [
      { date: new Date(now.getTime() - 30 * 86400000), value: 100 },
      { date: new Date(now.getTime() - 20 * 86400000), value: 110 },
      { date: new Date(now.getTime() - 10 * 86400000), value: 110 },
      { date: now, value: 110 },
    ];

    const result = detectPlateau(data);
    expect(result.isPlateau).toBe(true);
    expect(result.weeksSinceImprovement).toBeGreaterThanOrEqual(2);
    expect(result.suggestion).toBeTruthy();
  });

  it("suggests deload when performance declined", () => {
    const now = new Date();
    const data = [
      { date: new Date(now.getTime() - 30 * 86400000), value: 100 },
      { date: new Date(now.getTime() - 20 * 86400000), value: 110 },
      { date: new Date(now.getTime() - 10 * 86400000), value: 103 },
      { date: now, value: 103 },
    ];

    const result = detectPlateau(data);
    expect(result.isPlateau).toBe(true);
    expect(result.percentChange).toBeLessThan(-5);
    expect(result.suggestion).toContain("deload");
  });

  it("suggests program change when stuck for 4+ weeks", () => {
    const now = new Date();
    const data = [
      { date: new Date(now.getTime() - 60 * 86400000), value: 100 },
      { date: new Date(now.getTime() - 40 * 86400000), value: 105 },
      { date: new Date(now.getTime() - 30 * 86400000), value: 105 },
      { date: new Date(now.getTime() - 20 * 86400000), value: 105 },
      { date: new Date(now.getTime() - 10 * 86400000), value: 105 },
      { date: now, value: 105 },
    ];

    const result = detectPlateau(data);
    expect(result.isPlateau).toBe(true);
    expect(result.weeksSinceImprovement).toBeGreaterThanOrEqual(4);
    expect(result.suggestion).toContain("program");
  });

  it("uses custom minimum days threshold", () => {
    const now = new Date();
    const data = [
      { date: new Date(now.getTime() - 10 * 86400000), value: 100 },
      { date: now, value: 100 },
    ];

    // Default 14 days — should NOT be plateau
    const result1 = detectPlateau(data);
    expect(result1.isPlateau).toBe(false);

    // Custom 7 days — SHOULD be plateau
    const result2 = detectPlateau(data, 7);
    expect(result2.isPlateau).toBe(true);
  });

  it("handles single data point", () => {
    const result = detectPlateau([{ date: new Date(), value: 100 }]);
    expect(result.currentValue).toBe(100);
    expect(result.peakValue).toBe(100);
  });

  it("calculates percent change correctly", () => {
    const now = new Date();
    const data = [
      { date: new Date(now.getTime() - 20 * 86400000), value: 100 },
      { date: now, value: 100 },
    ];

    const result = detectPlateau(data);
    expect(result.percentChange).toBe(0);
  });
});

describe("calculateWeeklyAverages", () => {
  it("returns empty array for empty data", () => {
    expect(calculateWeeklyAverages([])).toEqual([]);
  });

  it("calculates weekly averages from daily data", () => {
    // Monday to Sunday = same week
    const monday = new Date("2026-08-24");
    const wednesday = new Date("2026-08-26");
    const friday = new Date("2026-08-28");

    const data = [
      { date: monday, value: 80 },
      { date: wednesday, value: 82 },
      { date: friday, value: 81 },
    ];

    const result = calculateWeeklyAverages(data);
    expect(result).toHaveLength(1);
    expect(result[0].average).toBeCloseTo(81, 0);
    expect(result[0].count).toBe(3);
  });

  it("separates data across weeks", () => {
    const week1Mon = new Date("2026-08-24");
    const week2Mon = new Date("2026-08-31");

    const data = [
      { date: week1Mon, value: 80 },
      { date: week2Mon, value: 82 },
    ];

    const result = calculateWeeklyAverages(data);
    expect(result).toHaveLength(2);
    expect(result[0].average).toBe(80);
    expect(result[1].average).toBe(82);
  });

  it("sorts results by week ascending", () => {
    const data = [
      { date: new Date("2026-09-07"), value: 82 },
      { date: new Date("2026-08-24"), value: 80 },
      { date: new Date("2026-08-31"), value: 81 },
    ];

    const result = calculateWeeklyAverages(data);
    expect(result[0].average).toBe(80);
    expect(result[1].average).toBe(81);
    expect(result[2].average).toBe(82);
  });
});
