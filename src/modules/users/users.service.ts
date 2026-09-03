import { NotFoundError } from '../../utils/ApiError.js'
import { usersRepository } from './users.repository.js'
import { authRepository } from '../auth/auth.repository.js'
import type { UpdateProfileInput } from './users.validators.js'
import type { UserDocument } from '../../models/User.model.js'
import type { ProfileDocument } from '../../models/Profile.model.js'
import type { HydratedDocument } from 'mongoose'

const DEFAULT_HEALTH = {
  injuries: [] as string[],
  medicalConditions: [] as string[],
  jointPain: [] as string[],
  previousSurgeries: [] as string[],
  exerciseRestrictions: [] as string[],
  nutritionPreference: '',
  sleepHours: 7,
  stressLevel: 3 as 1 | 2 | 3 | 4 | 5,
  smoking: false,
  alcohol: 'none' as const,
  supplements: [] as string[],
}

const DEFAULT_PRIVACY = {
  weight: 'friends' as const,
  streak: 'public' as const,
  workoutStats: 'friends' as const,
  volumeStats: 'friends' as const,
  nutritionStatus: 'friends' as const,
  growthScore: 'public' as const,
}

/**
 * Merges the auth-focused User document with its (possibly not-yet-created)
 * Profile document into the single flat shape the frontend's UserProfile
 * type expects — so the client never has to know these live in two
 * collections server-side.
 */
function toApiShape(user: HydratedDocument<UserDocument>, profile: HydratedDocument<ProfileDocument> | null) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name ?? '',
    avatarUrl: user.avatarUrl,
    age: profile?.age ?? 0,
    gender: profile?.gender ?? 'prefer_not_to_say',
    heightCm: profile?.heightCm ?? 0,
    currentWeightKg: profile?.currentWeightKg ?? 0,
    targetWeightKg: profile?.targetWeightKg ?? 0,
    bodyFatPct: profile?.bodyFatPct,
    occupation: profile?.occupation,
    activityLevel: profile?.activityLevel ?? 'moderate',
    country: profile?.country ?? '',
    timezone: profile?.timezone ?? '',
    fitnessExperience: profile?.fitnessExperience ?? 'beginner',
    yearsTraining: profile?.yearsTraining ?? 0,
    gymAccess: profile?.gymAccess ?? 'commercial_gym',
    equipmentAvailable: profile?.equipmentAvailable ?? [],
    trainingDaysPerWeek: profile?.trainingDaysPerWeek ?? 3,
    workoutDurationMinutes: profile?.workoutDurationMinutes ?? 60,
    goals: profile?.goals ?? [],
    dreamPhysique: profile?.dreamPhysique,
    customGoal: profile?.customGoal,
    health: profile?.health ?? DEFAULT_HEALTH,
    privacy: profile?.privacy ?? DEFAULT_PRIVACY,
    unitSystem: profile?.unitSystem ?? 'metric',
    onboardingCompleted: Boolean(user.onboardingCompleted),
    createdAt: (user as unknown as { createdAt: Date }).createdAt?.toISOString?.() ?? new Date().toISOString(),
  }
}

export const usersService = {
  async getMe(userId: string) {
    const user = await usersRepository.findUserById(userId)
    if (!user) throw new NotFoundError('User not found')
    const profile = await usersRepository.findProfileByUserId(userId)
    return toApiShape(user, profile)
  },

  async updateMe(userId: string, patch: UpdateProfileInput) {
    const { user, profile } = await usersRepository.upsertProfile(userId, patch)
    if (!user) throw new NotFoundError('User not found')
    return toApiShape(user, profile)
  },

  async deleteMe(userId: string) {
    await usersRepository.softDeleteUser(userId)
    // Kill every refresh token so no session can silently rotate back in;
    // the (already-issued, short-lived) access token dies on its own within
    // JWT_ACCESS_EXPIRES_IN.
    await authRepository.revokeAllRefreshTokensForUser(userId)
  },
}
