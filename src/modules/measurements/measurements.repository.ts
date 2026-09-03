import { Measurement } from '../../models/Measurement.model.js'
import type { CreateMeasurementInput, UpdateMeasurementInput, ListMeasurementsQuery } from './measurements.validators.js'

export const measurementsRepository = {
  create(userId: string, input: CreateMeasurementInput) {
    return Measurement.create({ ...input, userId })
  },

  findById(userId: string, id: string) {
    return Measurement.findOne({ _id: id, userId, deletedAt: null })
  },

  async find(userId: string, query: ListMeasurementsQuery) {
    const filter: Record<string, unknown> = { userId, deletedAt: null }
    if (query.from || query.to) {
      filter.date = {
        ...(query.from ? { $gte: new Date(query.from) } : {}),
        ...(query.to ? { $lte: new Date(query.to) } : {}),
      }
    }
    const skip = (query.page - 1) * query.limit
    const [items, total] = await Promise.all([
      Measurement.find(filter).sort({ date: -1 }).skip(skip).limit(query.limit).lean(),
      Measurement.countDocuments(filter),
    ])
    return { items, total, page: query.page, limit: query.limit }
  },

  latest(userId: string) {
    return Measurement.findOne({ userId, deletedAt: null }).sort({ date: -1 }).lean()
  },

  update(userId: string, id: string, patch: UpdateMeasurementInput) {
    return Measurement.findOneAndUpdate({ _id: id, userId, deletedAt: null }, { $set: patch }, { new: true })
  },

  softDelete(userId: string, id: string) {
    return Measurement.updateOne({ _id: id, userId }, { deletedAt: new Date() })
  },
}
