import { analyticsService } from '../analytics/analytics.service.js'
import { measurementsRepository } from '../measurements/measurements.repository.js'
import { workoutsService } from '../workouts/workouts.service.js'

/**
 * Read-only aggregation over workouts + measurements — the "Body Progress"
 * / "Progress Analytics" screens in one call, so the frontend doesn't have
 * to fan out to four different endpoints and stitch the response together
 * itself. Delegates the actual number-crunching to analyticsService rather
 * than duplicating it.
 */
export const progressService = {
  async overview(userId: string) {
    const [weightTrend, volumeTrend, muscleDistribution, measurements, streak] = await Promise.all([
      analyticsService.weightTrend(userId, 12),
      analyticsService.volumeTrend(userId, 12),
      analyticsService.muscleDistribution(userId, 30),
      measurementsRepository.find(userId, { page: 1, limit: 12 } as never),
      workoutsService.currentStreak(userId),
    ])

    return {
      weightTrend,
      volumeTrend,
      muscleDistribution,
      recentMeasurements: measurements.items,
      currentStreak: streak,
    }
  },
}
