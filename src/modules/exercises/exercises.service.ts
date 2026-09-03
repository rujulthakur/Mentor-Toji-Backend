import { NotFoundError } from '../../utils/ApiError.js'
import { exercisesRepository } from './exercises.repository.js'
import type { ListExercisesQuery } from './exercises.validators.js'

export const exercisesService = {
  async list(query: ListExercisesQuery) {
    return exercisesRepository.find(query)
  },

  async getById(id: string) {
    const exercise = await exercisesRepository.findById(id)
    if (!exercise) throw new NotFoundError('Exercise not found')
    return exercise
  },
}
