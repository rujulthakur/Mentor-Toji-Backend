import type { HydratedDocument } from 'mongoose'
import { NutritionLog, type NutritionLogDocument } from '../../models/NutritionLog.model.js'
import type { Macros, Micronutrients } from './nutrition.constants.js'
export interface MealDoc {
  id: string
  mealType: string
  time: string
  rawText: string
  items: Array<{ id: string; name: string; quantity: string; macros: Macros }>
  totals: Macros
  micronutrients: Micronutrients
  aiNotes: string
  createdAt: Date
}

/** Normalizes any date-ish input to UTC midnight of that calendar day —
 * the stable key every log document is stored under. Accepts a
 * `YYYY-MM-DD` string (what the frontend always sends) or defaults to
 * today if omitted. */
export function toDayKey(dateStr?: string): Date {
  const iso = dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : new Date().toISOString().slice(0, 10)
  return new Date(`${iso}T00:00:00.000Z`)
}

export const nutritionRepository = {
  async findOrCreate(userId: string, dateStr?: string) {
    const date = toDayKey(dateStr)
    let log = await NutritionLog.findOne({ userId, date })
    if (!log) {
      log = await NutritionLog.create({ userId, date, meals: [] })
    }
    return log
  },

  findByDate(userId: string, dateStr?: string) {
    return NutritionLog.findOne({ userId, date: toDayKey(dateStr) })
  },

  async findRange(userId: string, from?: string, to?: string, page = 1, limit = 30) {
    const filter: Record<string, unknown> = { userId }
    if (from || to) {
      filter.date = {
        ...(from ? { $gte: toDayKey(from) } : {}),
        ...(to ? { $lte: toDayKey(to) } : {}),
      }
    }
    const skip = (page - 1) * limit
    const [items, total] = await Promise.all([
      NutritionLog.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
      NutritionLog.countDocuments(filter),
    ])
    return { items, total, page, limit }
  },

  /** Most recent N day-logs, oldest first — the shape weekly/monthly analytics want. */
  async recentDays(userId: string, days: number) {
    const items = await NutritionLog.find({ userId }).sort({ date: -1 }).limit(days).lean()
    return items.reverse()
  },

    save(log: HydratedDocument<NutritionLogDocument> | null) {
    if (!log) return null
    return log.save()
  },
}
