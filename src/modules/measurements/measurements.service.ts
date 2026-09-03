import { NotFoundError } from '../../utils/ApiError.js'
import { measurementsRepository } from './measurements.repository.js'
import type { CreateMeasurementInput, UpdateMeasurementInput, ListMeasurementsQuery } from './measurements.validators.js'

export const measurementsService = {
  create(userId: string, input: CreateMeasurementInput) {
    return measurementsRepository.create(userId, input)
  },

  list(userId: string, query: ListMeasurementsQuery) {
    return measurementsRepository.find(userId, query)
  },

  latest(userId: string) {
    return measurementsRepository.latest(userId)
  },

  async update(userId: string, id: string, patch: UpdateMeasurementInput) {
    const updated = await measurementsRepository.update(userId, id, patch)
    if (!updated) throw new NotFoundError('Measurement not found')
    return updated
  },

  async delete(userId: string, id: string) {
    await measurementsRepository.softDelete(userId, id)
  },
}
