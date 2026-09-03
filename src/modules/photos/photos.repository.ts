import { ProgressPhoto } from '../../models/ProgressPhoto.model.js'
import type { ListPhotosQuery } from './photos.validators.js'

export const photosRepository = {
  create(userId: string, data: { date: Date; angle: string; url: string; cloudinaryPublicId?: string; weightKg?: number; bodyFatPct?: number; notes?: string }) {
    return ProgressPhoto.create({ ...data, userId })
  },

  findById(userId: string, id: string) {
    return ProgressPhoto.findOne({ _id: id, userId, deletedAt: null })
  },

  async find(userId: string, query: ListPhotosQuery) {
    const filter: Record<string, unknown> = { userId, deletedAt: null }
    if (query.angle) filter.angle = query.angle
    if (query.from || query.to) {
      filter.date = {
        ...(query.from ? { $gte: new Date(query.from) } : {}),
        ...(query.to ? { $lte: new Date(query.to) } : {}),
      }
    }
    const skip = (query.page - 1) * query.limit
    const [items, total] = await Promise.all([
      ProgressPhoto.find(filter).sort({ date: -1 }).skip(skip).limit(query.limit).lean(),
      ProgressPhoto.countDocuments(filter),
    ])
    return { items, total, page: query.page, limit: query.limit }
  },

  softDelete(userId: string, id: string) {
    return ProgressPhoto.updateOne({ _id: id, userId }, { deletedAt: new Date() })
  },
}
