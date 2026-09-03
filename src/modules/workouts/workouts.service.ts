import { NotFoundError } from '../../utils/ApiError.js'
import { workoutsRepository } from './workouts.repository.js'
import { runOverloadEngine, type OverloadResult } from './overloadEngine.js'
import type { CreateWorkoutInput, UpdateWorkoutInput, ListWorkoutsQuery } from './workouts.validators.js'
import type { WorkoutExerciseEntry } from './workouts.types.js'

export const workoutsService = {
  async create(userId: string, input: CreateWorkoutInput) {
    const session = await workoutsRepository.create(userId, input)
    let overload: OverloadResult[] = []
    if (session.status === 'completed') {
      overload = await runOverloadEngine(userId, String(session._id), session.date, session.exercises as unknown as WorkoutExerciseEntry[])
    }
    return { session, overload }
  },

  async list(userId: string, query: ListWorkoutsQuery) {
    return workoutsRepository.find(userId, query)
  },

  async getById(userId: string, id: string) {
    const session = await workoutsRepository.findById(userId, id)
    if (!session) throw new NotFoundError('Workout session not found')
    return session
  },

  async update(userId: string, id: string, patch: UpdateWorkoutInput) {
    const wasCompletedBefore = (await workoutsRepository.findById(userId, id))?.status === 'completed'
    const session = await workoutsRepository.update(userId, id, patch)
    if (!session) throw new NotFoundError('Workout session not found')

    let overload: OverloadResult[] = []
    // Only run the overload engine the moment a session transitions INTO
    // "completed" — re-saving an already-completed session (e.g. editing
    // notes) shouldn't re-trigger PR detection.
    if (session.status === 'completed' && !wasCompletedBefore) {
      overload = await runOverloadEngine(userId, String(session._id), session.date, session.exercises as unknown as WorkoutExerciseEntry[])
    }
    return { session, overload }
  },

  async delete(userId: string, id: string) {
    await workoutsRepository.softDelete(userId, id)
  },

  async listPersonalRecords(userId: string) {
    return workoutsRepository.listPersonalRecords(userId)
  },

  async currentStreak(userId: string) {
    const now = new Date()
    const oneYearAgo = new Date(now)
    oneYearAgo.setFullYear(now.getFullYear() - 1)
    const sessions = await workoutsRepository.findCompletedInRange(userId, oneYearAgo, now)

    const days = new Set(sessions.map((s) => new Date(s.date).toISOString().slice(0, 10)))
    let streak = 0
    const cursor = new Date(now)
    // Today doesn't have to be logged yet for the streak to still be "alive" —
    // only check today, then walk backwards requiring every day after that.
    if (!days.has(cursor.toISOString().slice(0, 10))) {
      cursor.setDate(cursor.getDate() - 1)
    }
    while (days.has(cursor.toISOString().slice(0, 10))) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    }
    return streak
  },
}
