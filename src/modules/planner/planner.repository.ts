import { WorkoutPlanner } from '../../models/WorkoutPlanner.model.js'
import type { Weekday } from './planner.types.js'
import type { UpdateDayInput } from './planner.validators.js'

export const plannerRepository = {
  async findOrCreate(userId: string) {
    const existing = await WorkoutPlanner.findOne({ userId })
    if (existing) return existing
    return WorkoutPlanner.create({ userId })
  },

  updateDay(userId: string, day: Weekday, input: UpdateDayInput) {
    // Order is derived from array position, not trusted from the client,
    // so drag-and-drop / move-up-down reordering is always reflected correctly.
    const exercises = input.exercises.map((ex, index) => ({ ...ex, order: index }))
    return WorkoutPlanner.findOneAndUpdate(
      { userId },
      { $set: { [`days.${day}`]: exercises }, $setOnInsert: { userId } },
      { upsert: true, new: true }
    )
  },
}
