import { workoutsRepository } from './workouts.repository.js'
import type { WorkoutExerciseEntry } from './workouts.types.js'

/** Epley formula — the industry-standard estimate for a 1-rep max from a submaximal set. */
function estimateOneRepMax(weightKg: number, reps: number): number {
  if (reps <= 0) return 0
  return Math.round(weightKg * (1 + reps / 30) * 100) / 100
}

function bestWorkingSet(entry: WorkoutExerciseEntry) {
  const workingSets = entry.sets.filter((s) => !s.isWarmup && s.completed && s.weightKg > 0 && s.reps > 0)
  if (workingSets.length === 0) return null
  return workingSets.reduce((best, s) => (estimateOneRepMax(s.weightKg, s.reps) > estimateOneRepMax(best.weightKg, best.reps) ? s : best))
}

function totalVolume(entry: WorkoutExerciseEntry) {
  return entry.sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0)
}

export interface OverloadResult {
  exerciseId: string
  exerciseName: string
  isPR: boolean
  estimatedOneRepMax: number
  previousBestKg?: number
  suggestion: string
}

/**
 * Runs after a workout session is saved as "completed". For every exercise
 * logged, compares against the stored PR and the previous session that
 * touched the same exercise, then:
 *   - updates the PersonalRecord collection when a new best is hit
 *   - returns a plain-language suggestion (+2.5kg, +1 rep, deload, etc.)
 *     for exercises that didn't improve, exactly per the spec's
 *     progressive overload engine.
 * Never throws — a bad/incomplete exercise entry is just skipped so one
 * malformed set never blocks saving the rest of the workout.
 */
export async function runOverloadEngine(
  userId: string,
  sessionId: string,
  sessionDate: Date,
  exercises: WorkoutExerciseEntry[]
): Promise<OverloadResult[]> {
  const results: OverloadResult[] = []

  for (const entry of exercises) {
    const best = bestWorkingSet(entry)
    if (!best) continue

    const est1RM = estimateOneRepMax(best.weightKg, best.reps)
    const existingPR = await workoutsRepository.getPersonalRecord(userId, entry.exerciseId)
    const isPR = !existingPR || est1RM > existingPR.estimatedOneRepMax

    if (isPR) {
      await workoutsRepository.upsertPersonalRecord(userId, entry.exerciseId, {
        exerciseName: entry.exerciseName,
        weightKg: best.weightKg,
        reps: best.reps,
        estimatedOneRepMax: est1RM,
        date: sessionDate,
        previousRecordKg: existingPR?.weightKg,
        workoutSessionId: sessionId,
      })
      results.push({
        exerciseId: entry.exerciseId,
        exerciseName: entry.exerciseName,
        isPR: true,
        estimatedOneRepMax: est1RM,
        previousBestKg: existingPR?.weightKg,
        suggestion: `New PR — ${best.weightKg}kg x ${best.reps}. Nice work.`,
      })
      continue
    }

    // Not a PR this session — compare volume against the last time this
    // exercise was trained to detect a plateau and suggest a next step.
    const prevSession = await workoutsRepository.findPreviousSessionForExercise(userId, entry.exerciseId, sessionId, sessionDate)
    const prevEntry = (prevSession?.exercises as unknown as WorkoutExerciseEntry[] | undefined)?.find(
      (e) => String(e.exerciseId) === String(entry.exerciseId)
    )

    let suggestion = 'Keep progressing — try adding weight or reps next session.'
    if (prevEntry) {
      const prevVolume = totalVolume(prevEntry)
      const currentVolume = totalVolume(entry)
      if (currentVolume <= prevVolume) {
        suggestion =
          'No improvement vs your last session — this looks like a plateau. ' +
          'Try +2.5kg, +1 rep, an extra set, a different exercise variation, or take a recovery/deload day.'
      } else {
        suggestion = 'Volume increased vs last time, even without a new 1RM — solid progress.'
      }
    }

    results.push({
      exerciseId: entry.exerciseId,
      exerciseName: entry.exerciseName,
      isPR: false,
      estimatedOneRepMax: est1RM,
      previousBestKg: existingPR?.weightKg,
      suggestion,
    })
  }

  return results
}
