/**
 * RPE/RIR Converter
 * PURE TypeScript — zero framework/DB imports
 *
 * RPE = Rate of Perceived Exertion (0-10 scale)
 * RIR = Reps in Reserve (how many more reps you could do)
 *
 * Conversion based on Helms (2016) and Zourdos (2021):
 * - RPE 10 = 0 RIR (absolute failure)
 * - RPE 9  = 1 RIR
 * - RPE 8  = 2 RIR
 * - RPE 7  = 3 RIR
 * - RPE 6  = 4 RIR
 * - RPE 5  = 5 RIR
 */

import { RPE_RIR_MAP } from "./constants";

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Converts RPE to RIR (Reps in Reserve).
 * Supports half-point RPE values (e.g. 8.5).
 *
 * @param rpe - Rate of Perceived Exertion (5-10, supports 0.5 increments)
 * @returns Reps in Reserve
 */
export function rpeToRir(rpe: number): number {
  // Clamp RPE to valid range
  const clamped = Math.max(5, Math.min(10, rpe));

  // Direct lookup for exact values
  if (clamped in RPE_RIR_MAP) {
    return RPE_RIR_MAP[clamped as keyof typeof RPE_RIR_MAP];
  }

  // Interpolate for non-exact values
  const lower = Math.floor(clamped * 2) / 2;
  const upper = Math.ceil(clamped * 2) / 2;

  if (lower === upper) return RPE_RIR_MAP[lower as keyof typeof RPE_RIR_MAP] ?? 5;

  const lowerRir = RPE_RIR_MAP[lower as keyof typeof RPE_RIR_MAP] ?? 5;
  const upperRir = RPE_RIR_MAP[upper as keyof typeof RPE_RIR_MAP] ?? 5;

  const t = (clamped - lower) / (upper - lower);
  return Math.round((lowerRir + t * (upperRir - lowerRir)) * 10) / 10;
}

/**
 * Converts RIR to RPE.
 *
 * @param rir - Reps in Reserve (0-5)
 * @returns Rate of Perceived Exertion (5-10)
 */
export function rirToRpe(rir: number): number {
  // Clamp RIR to valid range
  const clamped = Math.max(0, Math.min(5, rir));

  // Find the RPE that corresponds to this RIR
  for (const [rpeStr, rirValue] of Object.entries(RPE_RIR_MAP)) {
    if (Math.abs(rirValue - clamped) < 0.01) {
      return Number(rpeStr);
    }
  }

  // Interpolate
  const entries = Object.entries(RPE_RIR_MAP)
    .map(([rpe, rir]) => [Number(rpe), rir] as [number, number])
    .sort((a, b) => a[1] - b[1]);

  for (let i = 0; i < entries.length - 1; i++) {
    const [rpeLow, rirLow] = entries[i];
    const [rpeHigh, rirHigh] = entries[i + 1];

    if (clamped >= rirLow && clamped <= rirHigh) {
      const t = (clamped - rirLow) / (rirHigh - rirLow);
      return Math.round((rpeLow + t * (rpeHigh - rpeLow)) * 10) / 10;
    }
  }

  // Default: RIR 0 = RPE 10
  return 10;
}

/**
 * Validates that an RPE value is within the valid range.
 */
export function isValidRpe(rpe: number): boolean {
  return rpe >= 5 && rpe <= 10;
}

/**
 * Validates that an RIR value is within the valid range.
 */
export function isValidRir(rir: number): boolean {
  return rir >= 0 && rir <= 5;
}

/**
 * Returns a human-readable description for an RPE level.
 */
export function describeRpe(rpe: number): string {
  if (rpe >= 9.5) return "Maximum effort — absolute failure";
  if (rpe >= 9) return "Very hard — 1 rep left";
  if (rpe >= 8.5) return "Hard — 1-2 reps left";
  if (rpe >= 8) return "Hard — 2 reps left";
  if (rpe >= 7.5) return "Moderately hard — 2-3 reps left";
  if (rpe >= 7) return "Moderate — 3 reps left";
  if (rpe >= 6.5) return "Moderate — 3-4 reps left";
  if (rpe >= 6) return "Somewhat easy — 4 reps left";
  if (rpe >= 5.5) return "Easy — 4-5 reps left";
  return "Very easy — 5+ reps left";
}
