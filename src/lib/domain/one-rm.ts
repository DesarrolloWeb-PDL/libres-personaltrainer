/**
 * Estimated 1RM Calculator
 * PURE TypeScript — zero framework/DB imports
 *
 * Formulas based on:
 * - Epley (1990)
 * - Brzycki (1993)
 * - Lombardi (1989)
 */

import { ONE_RM_FORMULAS } from './constants'

// ─── Public API ──────────────────────────────────────────────────────

export interface OneRMResult {
  epley: number
  brzycki: number
  lombardi: number
  average: number
}

/**
 * Calculates estimated 1RM using multiple formulas.
 *
 * @param weight - Weight lifted (in kg or lbs)
 * @param reps   - Number of reps performed
 * @returns Object with each formula's estimate and an average
 */
export function estimate1RM(weight: number, reps: number): OneRMResult {
  if (weight <= 0 || reps <= 0) {
    return { epley: 0, brzycki: 0, lombardi: 0, average: 0 }
  }

  // Single rep = the weight IS the 1RM
  if (reps === 1) {
    return { epley: weight, brzycki: weight, lombardi: weight, average: weight }
  }

  const epley = ONE_RM_FORMULAS.epley(weight, reps)
  const brzycki = ONE_RM_FORMULAS.brzycki(weight, reps)
  const lombardi = ONE_RM_FORMULAS.lombardi(weight, reps)
  const average = (epley + brzycki + lombardi) / 3

  return {
    epley: round2(epley),
    brzycki: round2(brzycki),
    lombardi: round2(lombardi),
    average: round2(average),
  }
}

/**
 * Returns a single estimated 1RM using the Epley formula (most common).
 */
export function estimate1RMEpley(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  if (reps === 1) return weight
  return round2(ONE_RM_FORMULAS.epley(weight, reps))
}

// ─── Helpers ─────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
