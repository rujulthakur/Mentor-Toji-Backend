import { subDays, startOfDay } from 'date-fns'
import { workoutsRepository } from '../workouts/workouts.repository.js'
import { workoutsService } from '../workouts/workouts.service.js'
import { NutritionLog } from '../../models/NutritionLog.model.js'
import type { WorkoutExerciseEntry } from '../workouts/workouts.types.js'
import type { ProfileDocument } from '../../models/Profile.model.js'

function sessionVolume(exercises: WorkoutExerciseEntry[]): number {
  return exercises.reduce((sum, e) => sum + e.sets.reduce((s, set) => s + set.weightKg * set.reps, 0), 0)
}

export interface CommunityStats {
  currentWeightKg: number | null
  streak: number | null
  totalWorkoutDurationMinutes: number | null
  totalVolumeToday: number | null
  totalVolumeAllTime: number | null
  nutritionLoggingConsistencyPct: number | null
  growthScore: number | null
}

/**
 * Pulls together everything the "mutual growth community" score and the
 * friend-profile cards need for one user. Windows to the last 90 days for
 * the AllTime-ish volume/duration figures (not literally all-time — cheap
 * to compute per-request and plenty for a growth signal) and the last 30
 * days for nutrition-logging consistency, since that's the window a
 * "consistency" number should realistically reflect.
 */
export async function computeUserStats(userId: string): Promise<CommunityStats> {
  const now = new Date()
  const ninetyDaysAgo = subDays(now, 90)
  const thirtyDaysAgo = subDays(now, 30)
  const todayStart = startOfDay(now)

  const [sessions, streak, nutritionLogsCount] = await Promise.all([
    workoutsRepository.findCompletedInRange(userId, ninetyDaysAgo, now),
    workoutsService.currentStreak(userId),
    NutritionLog.countDocuments({ userId, date: { $gte: thirtyDaysAgo } }),
  ])

  const todaySession = sessions.filter((s) => new Date(s.date) >= todayStart)

  const totalVolumeAllTime = sessions.reduce(
    (sum, s) => sum + sessionVolume(s.exercises as unknown as WorkoutExerciseEntry[]),
    0
  )
  const totalVolumeToday = todaySession.reduce(
    (sum, s) => sum + sessionVolume(s.exercises as unknown as WorkoutExerciseEntry[]),
    0
  )
  const totalWorkoutDurationMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0)
  const nutritionLoggingConsistencyPct = Math.round((nutritionLogsCount / 30) * 100)

  const growthScore = computeGrowthScore({
    streak,
    sessionsIn90Days: sessions.length,
    totalWorkoutDurationMinutes,
    totalVolumeAllTime,
    nutritionLoggingConsistencyPct,
  })

  return {
    currentWeightKg: null, // filled in by the caller from the Profile doc it already has
    streak,
    totalWorkoutDurationMinutes,
    totalVolumeToday,
    totalVolumeAllTime,
    nutritionLoggingConsistencyPct,
    growthScore,
  }
}

/**
 * The community/competition score. Deliberately NOT a leaderboard-style
 * raw-volume comparison — every input rewards a user's own consistency
 * and effort, not how they stack up against a specific friend, so two
 * friends training completely different programs can both score well.
 * Capped at 100 per component so no single dimension can dominate.
 */
function computeGrowthScore(input: {
  streak: number
  sessionsIn90Days: number
  totalWorkoutDurationMinutes: number
  totalVolumeAllTime: number
  nutritionLoggingConsistencyPct: number
}): number {
  const streakScore = Math.min(input.streak * 4, 100) // ~25-day streak maxes this out
  const frequencyScore = Math.min((input.sessionsIn90Days / 36) * 100, 100) // ~4x/week over 90 days maxes out
  const durationScore = Math.min((input.totalWorkoutDurationMinutes / 2700) * 100, 100) // ~45 hrs over 90 days
  const volumeScore = Math.min((input.totalVolumeAllTime / 300000) * 100, 100) // rough 90-day volume ceiling
  const nutritionScore = Math.min(input.nutritionLoggingConsistencyPct, 100)

  const weighted =
    streakScore * 0.25 + frequencyScore * 0.25 + durationScore * 0.15 + volumeScore * 0.2 + nutritionScore * 0.15

  return Math.round(weighted)
}

export function currentWeightFromProfile(profile: Pick<ProfileDocument, 'currentWeightKg'> | null): number | null {
  return profile?.currentWeightKg ?? null
}
