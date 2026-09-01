import { describe, it, expect } from "vitest";
import { rpeToRir, rirToRpe, isValidRpe, isValidRir, describeRpe } from "./rpe";

describe("rpeToRir", () => {
  it("RPE 10 = 0 RIR", () => {
    expect(rpeToRir(10)).toBe(0);
  });

  it("RPE 9 = 1 RIR", () => {
    expect(rpeToRir(9)).toBe(1);
  });

  it("RPE 8 = 2 RIR", () => {
    expect(rpeToRir(8)).toBe(2);
  });

  it("RPE 7 = 3 RIR", () => {
    expect(rpeToRir(7)).toBe(3);
  });

  it("RPE 6 = 4 RIR", () => {
    expect(rpeToRir(6)).toBe(4);
  });

  it("RPE 5 = 5 RIR", () => {
    expect(rpeToRir(5)).toBe(5);
  });

  it("handles half-point RPE values", () => {
    expect(rpeToRir(8.5)).toBe(1.5);
    expect(rpeToRir(7.5)).toBe(2.5);
    expect(rpeToRir(6.5)).toBe(3.5);
    expect(rpeToRir(9.5)).toBe(0.5);
  });

  it("clamps RPE below 5 to 5 RIR", () => {
    expect(rpeToRir(4)).toBe(5);
    expect(rpeToRir(3)).toBe(5);
  });

  it("clamps RPE above 10 to 0 RIR", () => {
    expect(rpeToRir(11)).toBe(0);
  });
});

describe("rirToRpe", () => {
  it("RIR 0 = RPE 10", () => {
    expect(rirToRpe(0)).toBe(10);
  });

  it("RIR 1 = RPE 9", () => {
    expect(rirToRpe(1)).toBe(9);
  });

  it("RIR 2 = RPE 8", () => {
    expect(rirToRpe(2)).toBe(8);
  });

  it("RIR 3 = RPE 7", () => {
    expect(rirToRpe(3)).toBe(7);
  });

  it("RIR 4 = RPE 6", () => {
    expect(rirToRpe(4)).toBe(6);
  });

  it("RIR 5 = RPE 5", () => {
    expect(rirToRpe(5)).toBe(5);
  });

  it("handles half RIR values via interpolation", () => {
    expect(rirToRpe(1.5)).toBeCloseTo(8.5, 0);
    expect(rirToRpe(2.5)).toBeCloseTo(7.5, 0);
  });

  it("clamps RIR below 0 to RPE 10", () => {
    expect(rirToRpe(-1)).toBe(10);
  });

  it("clamps RIR above 5 to RPE 5", () => {
    expect(rirToRpe(6)).toBe(5);
  });
});

describe("round-trip conversion", () => {
  it("rpeToRir then rirToRpe returns original value", () => {
    for (const rpe of [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]) {
      const rir = rpeToRir(rpe);
      const roundTrip = rirToRpe(rir);
      expect(roundTrip).toBeCloseTo(rpe, 0);
    }
  });
});

describe("isValidRpe", () => {
  it("returns true for valid RPE", () => {
    expect(isValidRpe(5)).toBe(true);
    expect(isValidRpe(7.5)).toBe(true);
    expect(isValidRpe(10)).toBe(true);
  });

  it("returns false for invalid RPE", () => {
    expect(isValidRpe(4)).toBe(false);
    expect(isValidRpe(10.5)).toBe(false);
    expect(isValidRpe(-1)).toBe(false);
  });
});

describe("isValidRir", () => {
  it("returns true for valid RIR", () => {
    expect(isValidRir(0)).toBe(true);
    expect(isValidRir(2.5)).toBe(true);
    expect(isValidRir(5)).toBe(true);
  });

  it("returns false for invalid RIR", () => {
    expect(isValidRir(-0.5)).toBe(false);
    expect(isValidRir(5.5)).toBe(false);
  });
});

describe("describeRpe", () => {
  it("returns descriptive text for each range", () => {
    expect(describeRpe(10)).toContain("Maximum effort");
    expect(describeRpe(9)).toContain("Very hard");
    expect(describeRpe(8)).toContain("Hard");
    expect(describeRpe(7)).toContain("Moderate");
    expect(describeRpe(6)).toContain("Somewhat easy");
    expect(describeRpe(5)).toContain("Very easy");
  });

  it("all descriptions are non-empty strings", () => {
    for (let rpe = 5; rpe <= 10; rpe += 0.5) {
      const desc = describeRpe(rpe);
      expect(typeof desc).toBe("string");
      expect(desc.length).toBeGreaterThan(0);
    }
  });
});
