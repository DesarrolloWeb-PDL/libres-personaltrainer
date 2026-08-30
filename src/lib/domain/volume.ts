/**
 * Volume Engine — MEV/MAV/MRV calculations & status checks
 * PURE TypeScript — zero framework/DB imports
 *
 * Based on Schoenfeld (2017) volume landmarks:
 * - MEV: Minimum Effective Volume
 * - MAV: Maximum Adaptive Volume (sweet spot)
 * - MRV: Maximum Recoverable Volume
 */

import type {
  ExperienceLevel,
  MuscleGroup,
  VolumeLandmarks,
  VolumeStatus,
  VolumeTracking,
  WorkoutDay,
} from './types'

import { VOLUME_LANDMARKS, ALL_MUSCLE_GROUPS } from './constants'

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Returns the volume landmarks for a given experience level.
 */
export function getLandmarks(level: ExperienceLevel): VolumeLandmarks[] {
  return VOLUME_LANDMARKS[level]
}

/**
 * Returns volume landmarks for a specific muscle group.
 */
export function getLandmarksForMuscle(
  level: ExperienceLevel,
  muscle: MuscleGroup,
): VolumeLandmarks | undefined {
  return VOLUME_LANDMARKS[level].find(l => l.muscleGroup === muscle)
}

/**
 * Calculates weekly volume (sets per muscle group) from workout days.
 */
export function calculateWeeklyVolume(days: WorkoutDay[]): VolumeTracking[] {
  const volumeMap = new Map<MuscleGroup, { sets: number; volumeLoad: number }>()

  for (const day of days) {
    for (const exercise of day.exercises) {
      const muscle = exercise.exercise.muscleGroup
      const existing = volumeMap.get(muscle) ?? { sets: 0, volumeLoad: 0 }

      const exerciseVolumeLoad =
        exercise.sets * exercise.reps * (exercise.weight ?? 0)

      volumeMap.set(muscle, {
        sets: existing.sets + exercise.sets,
        volumeLoad: existing.volumeLoad + exerciseVolumeLoad,
      })
    }
  }

  return Array.from(volumeMap.entries()).map(([muscleGroup, data]) => ({
    muscleGroup,
    weeklySets: data.sets,
    volumeLoad: data.volumeLoad,
  }))
}

/**
 * Checks volume status for a single muscle group against its landmarks.
 */
export function checkVolumeStatus(
  weeklySets: number,
  landmark: VolumeLandmarks,
): VolumeStatus {
  if (weeklySets < landmark.MEV) return 'undertraining'
  if (weeklySets <= landmark.MAV) return 'optimal'
  return 'overreaching'
}

/**
 * Checks volume status for all muscle groups against landmarks.
 */
export function checkAllVolumeStatuses(
  days: WorkoutDay[],
  level: ExperienceLevel,
): { muscleGroup: MuscleGroup; status: VolumeStatus; sets: number; landmarks: VolumeLandmarks }[] {
  const weeklyVolume = calculateWeeklyVolume(days)
  const landmarks = VOLUME_LANDMARKS[level]

  // Include all muscle groups, even those with 0 sets
  const result: {
    muscleGroup: MuscleGroup
    status: VolumeStatus
    sets: number
    landmarks: VolumeLandmarks
  }[] = []

  for (const muscleGroup of ALL_MUSCLE_GROUPS) {
    const tracking = weeklyVolume.find(v => v.muscleGroup === muscleGroup)
    const landmark = landmarks.find(l => l.muscleGroup === muscleGroup)

    if (!landmark) continue

    result.push({
      muscleGroup,
      status: checkVolumeStatus(tracking?.weeklySets ?? 0, landmark),
      sets: tracking?.weeklySets ?? 0,
      landmarks: landmark,
    })
  }

  return result
}

/**
 * Applies volume landmarks to adjust exercise prescriptions.
 * Ensures each muscle group is within the MAV range.
 */
export function applyVolumeLandmarks(
  days: WorkoutDay[],
  level: ExperienceLevel,
): WorkoutDay[] {
  const statuses = checkAllVolumeStatuses(days, level)
  const adjustments = new Map<MuscleGroup, number>()

  for (const s of statuses) {
    if (s.status === 'undertraining') {
      // Need more sets — calculate deficit from MAV
      const deficit = s.landmarks.MAV - s.sets
      if (deficit > 0) {
        adjustments.set(s.muscleGroup, deficit)
      }
    } else if (s.status === 'overreaching') {
      // Need fewer sets — calculate excess above MAV
      const excess = s.sets - s.landmarks.MAV
      if (excess > 0) {
        adjustments.set(s.muscleGroup, -excess)
      }
    }
    // 'optimal' → no adjustment
  }

  if (adjustments.size === 0) return days

  // Apply adjustments to exercises
  return days.map(day => ({
    ...day,
    exercises: day.exercises.map(exercise => {
      const adj = adjustments.get(exercise.exercise.muscleGroup)
      if (adj === undefined || adj === 0) return exercise

      if (adj > 0) {
        // Add sets (up to a reasonable cap)
        return {
          ...exercise,
          sets: Math.min(exercise.sets + 1, 6),
        }
      } else {
        // Remove sets (minimum 1)
        return {
          ...exercise,
          sets: Math.max(exercise.sets - 1, 1),
        }
      }
    }),
  }))
}
