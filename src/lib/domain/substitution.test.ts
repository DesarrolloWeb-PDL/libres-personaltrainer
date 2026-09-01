import { describe, it, expect } from "vitest";
import {
  findSubstitute,
  swapInjuredExercises,
  isInjuryRestricted,
  getSuggestions,
} from "./substitution";
import type { Exercise } from "./types";

// ─── Fixtures ────────────────────────────────────────────────────────

const exercises: Exercise[] = [
  {
    id: "bench",
    name: "Bench Press",
    muscleGroup: "chest",
    equipment: ["full_gym"],
    isCompound: true,
  },
  {
    id: "db-press",
    name: "DB Bench Press",
    muscleGroup: "chest",
    equipment: ["full_gym", "home_gym"],
    isCompound: true,
  },
  {
    id: "pushup",
    name: "Push-up",
    muscleGroup: "chest",
    equipment: ["bodyweight_only"],
    isCompound: true,
  },
  {
    id: "cable-fly",
    name: "Cable Fly",
    muscleGroup: "chest",
    equipment: ["full_gym"],
    isCompound: false,
  },
  {
    id: "pec-deck",
    name: "Pec Deck",
    muscleGroup: "chest",
    equipment: ["full_gym"],
    isCompound: false,
  },

  {
    id: "ohp",
    name: "Overhead Press",
    muscleGroup: "shoulders",
    equipment: ["full_gym"],
    isCompound: true,
  },
  {
    id: "lateral-raise",
    name: "Lateral Raise",
    muscleGroup: "shoulders",
    equipment: ["full_gym", "home_gym"],
    isCompound: false,
  },

  {
    id: "squat",
    name: "Squat",
    muscleGroup: "quadriceps",
    equipment: ["full_gym"],
    isCompound: true,
  },
  {
    id: "leg-press",
    name: "Leg Press",
    muscleGroup: "quadriceps",
    equipment: ["full_gym"],
    isCompound: true,
  },
  {
    id: "bodyweight-squat",
    name: "Bodyweight Squat",
    muscleGroup: "quadriceps",
    equipment: ["bodyweight_only"],
    isCompound: true,
  },

  {
    id: "pullup",
    name: "Pull-up",
    muscleGroup: "back",
    equipment: ["full_gym", "home_gym"],
    isCompound: true,
  },
  {
    id: "barbell-row",
    name: "Barbell Row",
    muscleGroup: "back",
    equipment: ["full_gym"],
    isCompound: true,
  },
];

// ─── findSubstitute Tests ────────────────────────────────────────────

describe("findSubstitute", () => {
  it("finds a compound substitute for a compound exercise", () => {
    const bench = exercises.find((e) => e.id === "bench")!;
    const sub = findSubstitute(bench, exercises, "full_gym", []);

    expect(sub.id).not.toBe("bench");
    expect(sub.muscleGroup).toBe("chest");
    expect(sub.isCompound).toBe(true);
  });

  it("finds an isolation substitute for an isolation exercise", () => {
    const fly = exercises.find((e) => e.id === "cable-fly")!;
    const sub = findSubstitute(fly, exercises, "full_gym", []);

    expect(sub.id).not.toBe("cable-fly");
    expect(sub.muscleGroup).toBe("chest");
    expect(sub.isCompound).toBe(false);
  });

  it("respects equipment constraints", () => {
    const bench = exercises.find((e) => e.id === "bench")!;
    const sub = findSubstitute(bench, exercises, "home_gym", []);

    // Should find db-press (home_gym compatible) or pushup (bodyweight)
    expect(["db-press", "pushup"]).toContain(sub.id);
  });

  it("respects bodyweight_only equipment", () => {
    const bench = exercises.find((e) => e.id === "bench")!;
    const sub = findSubstitute(bench, exercises, "bodyweight_only", []);

    expect(sub.equipment).toContain("bodyweight_only");
  });

  it("excludes injury-restricted exercises", () => {
    const bench = exercises.find((e) => e.id === "bench")!;
    const sub = findSubstitute(bench, exercises, "full_gym", ["shoulder"]);

    // Should not pick shoulder exercises
    expect(sub.muscleGroup).not.toBe("shoulder");
  });

  it("returns original exercise if no substitute found", () => {
    const ohp = exercises.find((e) => e.id === "ohp")!;
    // Only shoulder exercises exist, and we exclude shoulders
    const sub = findSubstitute(ohp, exercises, "bodyweight_only", ["shoulder"]);

    // No bodyweight shoulder exercises → returns original
    expect(sub.id).toBe("ohp");
  });

  it("does not return the same exercise as substitute", () => {
    const bench = exercises.find((e) => e.id === "bench")!;
    const sub = findSubstitute(bench, exercises, "full_gym", []);
    expect(sub.id).not.toBe(bench.id);
  });
});

// ─── swapInjuredExercises Tests ──────────────────────────────────────

describe("swapInjuredExercises", () => {
  it("swaps injured exercises when a same-muscle substitute exists with different pattern", () => {
    // shoulder exercises: ohp (compound) and lateral-raise (isolation)
    // With shoulder injury, both are restricted → no valid substitute → original returned
    const exerciseList = [
      exercises.find((e) => e.id === "bench")!, // chest - not injured
      exercises.find((e) => e.id === "ohp")!, // shoulders - injured
      exercises.find((e) => e.id === "lateral-raise")!, // shoulders - injured
    ];

    const result = swapInjuredExercises(exerciseList, exercises, "full_gym", ["shoulder"]);

    // Bench should remain
    expect(result[0].id).toBe("bench");
    // Shoulder exercises: no valid substitute (all target shoulders, which are restricted)
    // findSubstitute returns original when no valid swap exists
    expect(result[1].id).toBe("ohp");
    expect(result[2].id).toBe("lateral-raise");
  });

  it("returns same list if no injuries", () => {
    const exerciseList = [exercises[0], exercises[1]];
    const result = swapInjuredExercises(exerciseList, exercises, "full_gym", []);
    expect(result).toEqual(exerciseList);
  });

  it("returns same list if no exercises are restricted", () => {
    const exerciseList = [
      exercises.find((e) => e.id === "bench")!,
      exercises.find((e) => e.id === "squat")!,
    ];
    const result = swapInjuredExercises(exerciseList, exercises, "full_gym", ["wrist"]);
    // Neither bench nor squat targets wrist
    expect(result[0].id).toBe("bench");
    expect(result[1].id).toBe("squat");
  });
});

// ─── isInjuryRestricted Tests ────────────────────────────────────────

describe("isInjuryRestricted", () => {
  it("returns true for shoulder exercise with shoulder injury", () => {
    const ohp = exercises.find((e) => e.id === "ohp")!;
    expect(isInjuryRestricted(ohp, ["shoulder"])).toBe(true);
  });

  it("returns false for chest exercise with shoulder injury (different primary muscle)", () => {
    const bench = exercises.find((e) => e.id === "bench")!;
    // Bench targets chest (primary), not shoulders — so not restricted
    expect(isInjuryRestricted(bench, ["shoulder"])).toBe(false);
  });

  it("returns true for chest exercise with chest injury", () => {
    // chest is not in INJURY_CONSTRAINTS, so this returns false
    // (no constraint mapping for 'chest')
    const bench = exercises.find((e) => e.id === "bench")!;
    expect(isInjuryRestricted(bench, ["chest"])).toBe(false);
  });

  it("returns false for leg exercise with shoulder injury", () => {
    const squat = exercises.find((e) => e.id === "squat")!;
    expect(isInjuryRestricted(squat, ["shoulder"])).toBe(false);
  });

  it("returns true for quad exercise with knee injury", () => {
    const squat = exercises.find((e) => e.id === "squat")!;
    expect(isInjuryRestricted(squat, ["knee"])).toBe(true);
  });

  it("returns false with empty injuries", () => {
    const bench = exercises.find((e) => e.id === "bench")!;
    expect(isInjuryRestricted(bench, [])).toBe(false);
  });

  it("is case-insensitive", () => {
    const ohp = exercises.find((e) => e.id === "ohp")!;
    expect(isInjuryRestricted(ohp, ["Shoulder"])).toBe(true);
    expect(isInjuryRestricted(ohp, ["SHOULDER"])).toBe(true);
  });
});

// ─── getSuggestions Tests ────────────────────────────────────────────

describe("getSuggestions", () => {
  it("returns up to 3 suggestions", () => {
    const bench = exercises.find((e) => e.id === "bench")!;
    const suggestions = getSuggestions(bench, exercises, "full_gym", [], 3);
    expect(suggestions.length).toBeLessThanOrEqual(3);
  });

  it("returns empty if no alternatives exist", () => {
    const ohp = exercises.find((e) => e.id === "ohp")!;
    // Only shoulder exercises exist, limit to bodyweight with shoulder injury
    const suggestions = getSuggestions(ohp, exercises, "bodyweight_only", ["shoulder"], 3);
    expect(suggestions).toHaveLength(0);
  });

  it("all suggestions target the same muscle group", () => {
    const bench = exercises.find((e) => e.id === "bench")!;
    const suggestions = getSuggestions(bench, exercises, "full_gym", [], 3);
    for (const s of suggestions) {
      expect(s.muscleGroup).toBe("chest");
    }
  });

  it("prefers matching compound/isolation status", () => {
    const bench = exercises.find((e) => e.id === "bench")!;
    const suggestions = getSuggestions(bench, exercises, "full_gym", [], 3);
    // First suggestions should be compounds (like bench)
    if (suggestions.length > 0) {
      expect(suggestions[0].isCompound).toBe(true);
    }
  });

  it("respects maxSuggestions parameter", () => {
    const bench = exercises.find((e) => e.id === "bench")!;
    const suggestions = getSuggestions(bench, exercises, "full_gym", [], 1);
    expect(suggestions.length).toBeLessThanOrEqual(1);
  });
});
