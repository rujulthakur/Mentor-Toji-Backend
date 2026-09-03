import { subDays, subMonths, subYears, startOfWeek, startOfMonth } from 'date-fns'
import { workoutsRepository } from '../workouts/workouts.repository.js'
import { measurementsRepository } from '../measurements/measurements.repository.js'
import { workoutsService } from '../workouts/workouts.service.js'
import type { WorkoutExerciseEntry } from '../workouts/workouts.types.js'

function sessionVolume(exercises: WorkoutExerciseEntry[]): number {
  return exercises.reduce((sum, e) => sum + e.sets.reduce((s, set) => s + set.weightKg * set.reps, 0), 0)
}

export const analyticsService = {
  /** Everything the dashboard's "today" + summary cards need in one call. */
  async dashboard(userId: string) {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const monthStart = startOfMonth(now)
    const yearAgo = subYears(now, 1)

    const [weekSessions, monthSessions, yearSessions, latestMeasurement, personalRecords, streak] = await Promise.all([
      workoutsRepository.findCompletedInRange(userId, weekStart, now),
      workoutsRepository.findCompletedInRange(userId, monthStart, now),
      workoutsRepository.findCompletedInRange(userId, yearAgo, now),
      measurementsRepository.latest(userId),
      workoutsRepository.listPersonalRecords(userId),
      workoutsService.currentStreak(userId),
    ])

    const today = new Date().toISOString().slice(0, 10)
    const todaySession = yearSessions.find((s) => new Date(s.date).toISOString().slice(0, 10) === today)

    return {
      today: todaySession
        ? {
            name: todaySession.name,
            durationMinutes: todaySession.durationMinutes,
            caloriesBurned: todaySession.caloriesBurned,
            volume: sessionVolume(todaySession.exercises as unknown as WorkoutExerciseEntry[]),
            exerciseCount: todaySession.exercises.length,
          }
        : null,
      currentWeightKg: latestMeasurement?.weightKg ?? null,
      currentStreak: streak,
      weeklyProgress: {
        sessionsCompleted: weekSessions.length,
        totalVolume: weekSessions.reduce((sum, s) => sum + sessionVolume(s.exercises as unknown as WorkoutExerciseEntry[]), 0),
      },
      monthlyProgress: {
        sessionsCompleted: monthSessions.length,
        totalVolume: monthSessions.reduce((sum, s) => sum + sessionVolume(s.exercises as unknown as WorkoutExerciseEntry[]), 0),
      },
      recentPRs: personalRecords.slice(0, 5),
    }
  },

  /** Volume grouped by week for the last N weeks, for the progress charts. */
  async volumeTrend(userId: string, weeks = 12) {
    const now = new Date()
    const from = subDays(now, weeks * 7)
    const sessions = await workoutsRepository.findCompletedInRange(userId, from, now)

    const buckets = new Map<string, number>()
    for (const s of sessions) {
      const weekKey = startOfWeek(new Date(s.date), { weekStartsOn: 1 }).toISOString().slice(0, 10)
      const vol = sessionVolume(s.exercises as unknown as WorkoutExerciseEntry[])
      buckets.set(weekKey, (buckets.get(weekKey) ?? 0) + vol)
    }
    return Array.from(buckets.entries())
      .map(([weekStart, volume]) => ({ weekStart, volume }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
  },

  /** Set-count distribution across muscle groups, for the "muscle distribution" chart. */
  async muscleDistribution(userId: string, days = 30) {
    const now = new Date()
    const from = subDays(now, days)
    const sessions = await workoutsRepository.findCompletedInRange(userId, from, now)

    // Muscle group isn't stored on the workout entry itself (only exerciseId/name),
    // so this aggregates by exercise name as a reasonable proxy without an extra join.
    const counts = new Map<string, number>()
    for (const s of sessions) {
      for (const e of s.exercises as unknown as WorkoutExerciseEntry[]) {
        counts.set(e.exerciseName, (counts.get(e.exerciseName) ?? 0) + e.sets.length)
      }
    }
    return Array.from(counts.entries()).map(([exerciseName, setCount]) => ({ exerciseName, setCount }))
  },

  async weightTrend(userId: string, months = 6) {
    const from = subMonths(new Date(), months)
    const { items } = await measurementsRepository.find(userId, { from: from.toISOString(), page: 1, limit: 200 } as never)
    return items.map((m) => ({ date: m.date, weightKg: m.weightKg, bodyFatPct: m.bodyFatPct }))
  },
}
