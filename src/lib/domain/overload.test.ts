import { describe, it, expect } from 'vitest'
import { recommendOverload } from './overload'
import type { WorkoutExercise } from './types'

// ─── Fixtures ────────────────────────────────────────────────────────

const makeExercise = (overrides: Partial<WorkoutExercise> = {}): WorkoutExercise => ({
  exercise: {
    id: 'bench',
    name: 'Bench Press',
    muscleGroup: 'chest',
    equipment: ['full_gym'],
    isCompound: true,
  },
  sets: 3,
  reps: 8,
  weight: 100,
  rpe: 7.5,
  ...overrides,
})

// ─── Easy Load (RPE < 7) ─────────────────────────────────────────────

describe('recommendOverload — easy load', () => {
  it('recommends weight increase when RPE is 6', () => {
    const result = recommendOverload([makeExercise({ rpe: 6 })])
    expect(result[0].recommendedWeight).toBeGreaterThan(100)
    expect(result[0].reason).toContain('too light')
  })

  it('recommends weight increase when RPE is 5', () => {
    const result = recommendOverload([makeExercise({ rpe: 5, weight: 80 })])
    expect(result[0].recommendedWeight).toBeGreaterThan(80)
  })

  it('recommends at least +2.5 weight increase', () => {
    const result = recommendOverload([makeExercise({ rpe: 6, weight: 5 })])
    expect(result[0].recommendedWeight!).toBeGreaterThanOrEqual(7.5)
  })

  it('caps increase at 10%', () => {
    const result = recommendOverload([makeExercise({ rpe: 6, weight: 100 })])
    const increase = (result[0].recommendedWeight! - 100) / 100
    expect(increase).toBeLessThanOrEqual(0.10)
  })
})

// ─── Moderate Load (RPE 7-9) ─────────────────────────────────────────

describe('recommendOverload — moderate load', () => {
  it('recommends rep increase when RPE is 7', () => {
    const result = recommendOverload([makeExercise({ rpe: 7 })])
    expect(result[0].recommendedReps).toBe(9) // 8 + 1
    expect(result[0].recommendedWeight).toBe(100) // same weight
    expect(result[0].reason).toContain('Add 1 rep')
  })

  it('recommends rep increase when RPE is 8', () => {
    const result = recommendOverload([makeExercise({ rpe: 8 })])
    expect(result[0].recommendedReps).toBe(9)
  })

  it('recommends rep increase when RPE is 8.5', () => {
    const result = recommendOverload([makeExercise({ rpe: 8.5 })])
    expect(result[0].recommendedReps).toBe(9)
  })

  it('maintains same weight', () => {
    const result = recommendOverload([makeExercise({ rpe: 7.5, weight: 120 })])
    expect(result[0].recommendedWeight).toBe(120)
  })
})

// ─── Hard Load (RPE > 9) ─────────────────────────────────────────────

describe('recommendOverload — hard load', () => {
  it('recommends weight decrease when RPE is 9.5', () => {
    const result = recommendOverload([makeExercise({ rpe: 9.5 })])
    expect(result[0].recommendedWeight).toBeLessThan(100)
    expect(result[0].reason).toContain('too heavy')
  })

  it('recommends weight decrease when RPE is 10', () => {
    const result = recommendOverload([makeExercise({ rpe: 10 })])
    expect(result[0].recommendedWeight).toBeLessThan(100)
  })

  it('decreases by at least 3%', () => {
    const result = recommendOverload([makeExercise({ rpe: 9.5, weight: 100 })])
    const decrease = (100 - result[0].recommendedWeight!) / 100
    expect(decrease).toBeGreaterThanOrEqual(0.03)
  })

  it('decreases by at most 5%', () => {
    const result = recommendOverload([makeExercise({ rpe: 10, weight: 100 })])
    const decrease = (100 - result[0].recommendedWeight!) / 100
    expect(decrease).toBeLessThanOrEqual(0.05)
  })

  it('recommends at least -2.5 weight decrease', () => {
    const result = recommendOverload([makeExercise({ rpe: 10, weight: 10 })])
    expect(result[0].recommendedWeight!).toBeGreaterThanOrEqual(7.5)
  })
})

// ─── Edge Cases ──────────────────────────────────────────────────────

describe('recommendOverload — edge cases', () => {
  it('handles exercise with no RPE (defaults to 7.5)', () => {
    const result = recommendOverload([makeExercise({ rpe: undefined })])
    // RPE 7.5 → moderate → rep increase
    expect(result[0].recommendedReps).toBe(9)
  })

  it('handles exercise with no weight (returns minimum 2.5)', () => {
    const result = recommendOverload([makeExercise({ rpe: 6, weight: undefined })])
    expect(result[0].recommendedWeight).toBe(2.5)
  })

  it('processes multiple exercises', () => {
    const exercises = [
      makeExercise({ rpe: 6 }),
      makeExercise({ rpe: 8 }),
      makeExercise({ rpe: 10 }),
    ]
    const result = recommendOverload(exercises)
    expect(result).toHaveLength(3)
  })

  it('returns prescription with all required fields', () => {
    const result = recommendOverload([makeExercise()])
    const p = result[0]
    expect(p).toHaveProperty('exerciseId')
    expect(p).toHaveProperty('exerciseName')
    expect(p).toHaveProperty('currentSets')
    expect(p).toHaveProperty('currentReps')
    expect(p).toHaveProperty('currentWeight')
    expect(p).toHaveProperty('recommendedSets')
    expect(p).toHaveProperty('recommendedReps')
    expect(p).toHaveProperty('recommendedWeight')
    expect(p).toHaveProperty('reason')
  })

  it('preserves current values in prescription', () => {
    const result = recommendOverload([makeExercise({ sets: 4, reps: 10, weight: 80 })])
    const p = result[0]
    expect(p.currentSets).toBe(4)
    expect(p.currentReps).toBe(10)
    expect(p.currentWeight).toBe(80)
  })
})
