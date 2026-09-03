import { WorkoutSession } from '../../models/Workout.model.js'
import { PersonalRecord } from '../../models/PersonalRecord.model.js'
import type { CreateWorkoutInput, UpdateWorkoutInput, ListWorkoutsQuery } from './workouts.validators.js'

export const workoutsRepository = {
  create(userId: string, input: CreateWorkoutInput) {
    return WorkoutSession.create({ ...input, userId })
  },

  findById(userId: string, id: string) {
    return WorkoutSession.findOne({ _id: id, userId, deletedAt: null })
  },

  async find(userId: string, query: ListWorkoutsQuery) {
    const filter: Record<string, unknown> = { userId, deletedAt: null }
    if (query.from || query.to) {
      filter.date = {
        ...(query.from ? { $gte: new Date(query.from) } : {}),
        ...(query.to ? { $lte: new Date(query.to) } : {}),
      }
    }
    if (query.exerciseId) filter['exercises.exerciseId'] = query.exerciseId

    const skip = (query.page - 1) * query.limit
    const [items, total] = await Promise.all([
      WorkoutSession.find(filter).sort({ date: -1 }).skip(skip).limit(query.limit).lean(),
      WorkoutSession.countDocuments(filter),
    ])
    return { items, total, page: query.page, limit: query.limit }
  },

  update(userId: string, id: string, patch: UpdateWorkoutInput) {
    return WorkoutSession.findOneAndUpdate({ _id: id, userId, deletedAt: null }, { $set: patch }, { new: true })
  },

  softDelete(userId: string, id: string) {
    return WorkoutSession.updateOne({ _id: id, userId }, { deletedAt: new Date() })
  },

  /** Most recent *other* completed session that touched this exercise — used by the PR/overload engine. */
  findPreviousSessionForExercise(userId: string, exerciseId: string, excludeSessionId: string, before: Date) {
    return WorkoutSession.findOne({
      userId,
      deletedAt: null,
      status: 'completed',
      _id: { $ne: excludeSessionId },
      date: { $lt: before },
      'exercises.exerciseId': exerciseId,
    })
      .sort({ date: -1 })
      .lean()
  },

  getPersonalRecord(userId: string, exerciseId: string) {
    return PersonalRecord.findOne({ userId, exerciseId })
  },

  upsertPersonalRecord(
    userId: string,
    exerciseId: string,
    data: { exerciseName: string; weightKg: number; reps: number; estimatedOneRepMax: number; date: Date; previousRecordKg?: number; workoutSessionId: string }
  ) {
    return PersonalRecord.findOneAndUpdate({ userId, exerciseId }, { $set: data }, { upsert: true, new: true })
  },

  listPersonalRecords(userId: string) {
    return PersonalRecord.find({ userId }).sort({ date: -1 }).lean()
  },

  /** All completed sessions in range, used by the analytics module (volume/streak/frequency). */
  findCompletedInRange(userId: string, from: Date, to: Date) {
    return WorkoutSession.find({ userId, deletedAt: null, status: 'completed', date: { $gte: from, $lte: to } })
      .sort({ date: 1 })
      .lean()
  },
}
