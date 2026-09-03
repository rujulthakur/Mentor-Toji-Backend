import { Exercise } from '../../models/Exercise.model.js'
import type { ListExercisesQuery } from './exercises.validators.js'

export const exercisesRepository = {
  async find(query: ListExercisesQuery) {
    const filter: Record<string, unknown> = { deletedAt: null }

    if (query.muscle) {
      filter.$or = [{ primaryMuscle: query.muscle }, { secondaryMuscles: query.muscle }]
    }
    if (query.equipment) filter.equipment = query.equipment
    if (query.movementPattern) filter.movementPattern = query.movementPattern
    if (query.difficulty) filter.difficulty = query.difficulty
    if (query.q) {
      filter.name = { $regex: query.q, $options: 'i' }
    }

    const skip = (query.page - 1) * query.limit
    const [items, total] = await Promise.all([
      Exercise.find(filter).sort({ name: 1 }).skip(skip).limit(query.limit).lean(),
      Exercise.countDocuments(filter),
    ])

    return { items, total, page: query.page, limit: query.limit }
  },

  findById(id: string) {
    return Exercise.findOne({ _id: id, deletedAt: null }).lean()
  },

  findByIds(ids: string[]) {
    return Exercise.find({ _id: { $in: ids }, deletedAt: null }).lean()
  },
}
