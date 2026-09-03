import { Settings } from '../../models/Settings.model.js'
import type { UpdateSettingsInput } from './settings.validators.js'

export const settingsRepository = {
  async findOrCreate(userId: string) {
    const existing = await Settings.findOne({ userId })
    if (existing) return existing
    return Settings.create({ userId })
  },

  update(userId: string, patch: UpdateSettingsInput) {
    const $set: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(patch)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const [k, v] of Object.entries(value)) $set[`${key}.${k}`] = v
      } else {
        $set[key] = value
      }
    }
    return Settings.findOneAndUpdate({ userId }, { $set, $setOnInsert: { userId } }, { upsert: true, new: true })
  },
}
