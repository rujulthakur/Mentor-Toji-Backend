import { settingsRepository } from './settings.repository.js'
import type { UpdateSettingsInput } from './settings.validators.js'

export const settingsService = {
  get(userId: string) {
    return settingsRepository.findOrCreate(userId)
  },
  update(userId: string, patch: UpdateSettingsInput) {
    return settingsRepository.update(userId, patch)
  },
}
