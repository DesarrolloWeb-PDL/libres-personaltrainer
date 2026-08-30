/**
 * Substitution Engine — Injury-Aware Exercise Swaps
 * PURE TypeScript — zero framework/DB imports
 *
 * Swaps exercises based on:
 * - Muscle group match
 * - Equipment compatibility
 * - Injury constraints
 */

import type {
  Exercise,
  Equipment,
  MuscleGroup,
} from './types'

import { INJURY_CONSTRAINTS } from './constants'

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Finds a substitute exercise that:
 * 1. Targets the same muscle group
 * 2. Is compatible with available equipment
 * 3. Is not contraindicated by injuries
 *
 * @param exercise       - Exercise to replace
 * @param allExercises   - Pool of available exercises
 * @param equipment      - Equipment available to the user
 * @param injuries       - List of injury keywords (e.g. ["shoulder", "knee"])
 * @returns A suitable substitute, or the original exercise if none found
 */
export function findSubstitute(
  exercise: Exercise,
  allExercises: Exercise[],
  equipment: Equipment,
  injuries: string[] = [],
): Exercise {
  const candidates = allExercises.filter(e =>
    e.id !== exercise.id &&
    e.muscleGroup === exercise.muscleGroup &&
    isEquipmentCompatible(e, equipment) &&
    !isInjuryRestricted(e, injuries),
  )

  // Prefer compounds if original was compound, else isolations
  const preferred = exercise.isCompound
    ? candidates.filter(c => c.isCompound)
    : candidates.filter(c => !c.isCompound)

  // Fall back to any candidate
  return preferred[0] ?? candidates[0] ?? exercise
}

/**
 * Swaps all exercises in a list that violate injury constraints.
 */
export function swapInjuredExercises(
  exercises: Exercise[],
  allExercises: Exercise[],
  equipment: Equipment,
  injuries: string[],
): Exercise[] {
  return exercises.map(exercise => {
    if (isInjuryRestricted(exercise, injuries)) {
      return findSubstitute(exercise, allExercises, equipment, injuries)
    }
    return exercise
  })
}

/**
 * Checks if an exercise is contraindicated given a list of injuries.
 */
export function isInjuryRestricted(
  exercise: Exercise,
  injuries: string[],
): boolean {
  for (const injury of injuries) {
    const restrictedMuscles = INJURY_CONSTRAINTS[injury.toLowerCase()]
    if (restrictedMuscles && restrictedMuscles.includes(exercise.muscleGroup)) {
      return true
    }
  }
  return false
}

// ─── Equipment Compatibility ─────────────────────────────────────────

/**
 * Checks if an exercise is compatible with available equipment.
 * An exercise is compatible if the user's equipment type is in the
 * exercise's equipment list, OR the exercise is bodyweight-only.
 */
function isEquipmentCompatible(exercise: Exercise, userEquipment: Equipment): boolean {
  // Bodyweight exercises are always compatible
  if (exercise.equipment.includes('bodyweight_only')) return true

  // Full gym has everything
  if (userEquipment === 'full_gym') return true

  // Home gym: check if exercise requires only home equipment
  if (userEquipment === 'home_gym') {
    return exercise.equipment.includes('home_gym') ||
           exercise.equipment.includes('bodyweight_only')
  }

  // Bodyweight only
  return exercise.equipment.includes('bodyweight_only')
}

// ─── Substitution Suggestions ────────────────────────────────────────

/**
 * Returns a list of up to N substitute suggestions for an exercise.
 * Useful for UI display.
 */
export function getSuggestions(
  exercise: Exercise,
  allExercises: Exercise[],
  equipment: Equipment,
  injuries: string[],
  maxSuggestions: number = 3,
): Exercise[] {
  const candidates = allExercises.filter(e =>
    e.id !== exercise.id &&
    e.muscleGroup === exercise.muscleGroup &&
    isEquipmentCompatible(e, equipment) &&
    !isInjuryRestricted(e, injuries),
  )

  // Sort: prefer matching compound/isolation status, then by name
  const sorted = candidates.sort((a, b) => {
    const aMatch = a.isCompound === exercise.isCompound ? 0 : 1
    const bMatch = b.isCompound === exercise.isCompound ? 0 : 1
    return aMatch - bMatch
  })

  return sorted.slice(0, maxSuggestions)
}
