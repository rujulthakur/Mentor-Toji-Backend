import { plannerRepository } from './planner.repository.js'
import type { Weekday } from './planner.types.js'
import type { UpdateDayInput } from './planner.validators.js'

export const plannerService = {
  get(userId: string) {
    return plannerRepository.findOrCreate(userId)
  },

  updateDay(userId: string, day: Weekday, input: UpdateDayInput) {
    return plannerRepository.updateDay(userId, day, input)
  },
}
