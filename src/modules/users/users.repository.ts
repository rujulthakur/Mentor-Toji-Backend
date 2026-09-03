import { User } from '../../models/User.model.js'
import { Profile } from '../../models/Profile.model.js'
import type { UpdateProfileInput } from './users.validators.js'

export const usersRepository = {
  findUserById(id: string) {
    return User.findOne({ _id: id, deletedAt: null })
  },

  findProfileByUserId(userId: string) {
    return Profile.findOne({ userId })
  },

  async upsertProfile(userId: string, patch: UpdateProfileInput) {
    const { name, avatarUrl, onboardingCompleted, ...profileFields } = patch

    if (name !== undefined || avatarUrl !== undefined || onboardingCompleted !== undefined) {
      await User.updateOne(
        { _id: userId },
        {
          $set: {
            ...(name !== undefined ? { name } : {}),
            ...(avatarUrl !== undefined ? { avatarUrl } : {}),
            ...(onboardingCompleted !== undefined ? { onboardingCompleted } : {}),
          },
        }
      )
    }

    if (Object.keys(profileFields).length > 0) {
      const { health, privacy, ...rest } = profileFields
      const $set: Record<string, unknown> = { ...rest }
      if (health) {
        for (const [k, v] of Object.entries(health)) {
          $set[`health.${k}`] = v
        }
      }
      if (privacy) {
        for (const [k, v] of Object.entries(privacy)) {
          $set[`privacy.${k}`] = v
        }
      }
      await Profile.updateOne({ userId }, { $set, $setOnInsert: { userId } }, { upsert: true })
    }

    const [user, profile] = await Promise.all([this.findUserById(userId), this.findProfileByUserId(userId)])
    return { user, profile }
  },

  softDeleteUser(id: string) {
    return User.updateOne({ _id: id }, { deletedAt: new Date() })
  },
}
