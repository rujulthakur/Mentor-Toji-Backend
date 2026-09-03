import { z } from 'zod'

const healthSchema = z
  .object({
    injuries: z.array(z.string()),
    medicalConditions: z.array(z.string()),
    jointPain: z.array(z.string()),
    previousSurgeries: z.array(z.string()),
    exerciseRestrictions: z.array(z.string()),
    nutritionPreference: z.string(),
    sleepHours: z.number().min(0).max(24),
    stressLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    smoking: z.boolean(),
    alcohol: z.enum(['none', 'occasional', 'moderate', 'frequent']),
    supplements: z.array(z.string()),
  })
  .partial()

/**
 * Every field is optional because onboarding happens across multiple
 * wizard steps, each PATCHing a slice of the profile — never the whole
 * document at once.
 */
const privacySchema = z
  .object({
    weight: z.enum(['public', 'friends', 'private']),
    streak: z.enum(['public', 'friends', 'private']),
    workoutStats: z.enum(['public', 'friends', 'private']),
    volumeStats: z.enum(['public', 'friends', 'private']),
    nutritionStatus: z.enum(['public', 'friends', 'private']),
    growthScore: z.enum(['public', 'friends', 'private']),
  })
  .partial()

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).optional(),
  avatarUrl: z.string().url().optional(),

  age: z.number().int().min(10).max(120).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  heightCm: z.number().positive().optional(),
  currentWeightKg: z.number().positive().optional(),
  targetWeightKg: z.number().positive().optional(),
  bodyFatPct: z.number().min(0).max(100).optional(),
  occupation: z.string().optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),

  fitnessExperience: z.enum(['beginner', 'intermediate', 'advanced', 'professional']).optional(),
  yearsTraining: z.number().min(0).optional(),
  gymAccess: z.enum(['home_gym', 'commercial_gym', 'both', 'no_equipment']).optional(),
  equipmentAvailable: z.array(z.string()).optional(),
  trainingDaysPerWeek: z.number().int().min(1).max(7).optional(),
  workoutDurationMinutes: z.number().int().min(10).optional(),

  goals: z.array(z.string()).optional(),
  dreamPhysique: z.string().optional(),
  customGoal: z.string().optional(),

  health: healthSchema.optional(),

  privacy: privacySchema.optional(),

  unitSystem: z.enum(['metric', 'imperial']).optional(),

  /** Set true once the onboarding wizard's final step is submitted. */
  onboardingCompleted: z.boolean().optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
