import { Schema, model, type InferSchemaType } from 'mongoose'

/**
 * The full fitness profile collected by the onboarding wizard. One
 * document per user, referenced by userId (1:1 with User). Kept separate
 * from the auth-focused User model so onboarding fields can evolve freely
 * without ever touching auth/session logic.
 */
const healthSchema = new Schema(
  {
    injuries: { type: [String], default: [] },
    medicalConditions: { type: [String], default: [] },
    jointPain: { type: [String], default: [] },
    previousSurgeries: { type: [String], default: [] },
    exerciseRestrictions: { type: [String], default: [] },
    nutritionPreference: { type: String, default: '' },
    sleepHours: { type: Number, default: 7 },
    stressLevel: { type: Number, min: 1, max: 5, default: 3 },
    smoking: { type: Boolean, default: false },
    alcohol: { type: String, enum: ['none', 'occasional', 'moderate', 'frequent'], default: 'none' },
    supplements: { type: [String], default: [] },
  },
  { _id: false }
)

/**
 * Per-field visibility for the Friends community area. 'public' = any
 * user can see it (e.g. via search results), 'friends' = only accepted
 * friends can see it, 'private' = nobody but the owner. Defaults favor a
 * friendly-but-not-oversharing community: streak/score are public
 * (that's the whole point of a growth community), the rest defaults to
 * friends-only.
 */
const privacySchema = new Schema(
  {
    weight: { type: String, enum: ['public', 'friends', 'private'], default: 'friends' },
    streak: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
    workoutStats: { type: String, enum: ['public', 'friends', 'private'], default: 'friends' },
    volumeStats: { type: String, enum: ['public', 'friends', 'private'], default: 'friends' },
    nutritionStatus: { type: String, enum: ['public', 'friends', 'private'], default: 'friends' },
    growthScore: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
  },
  { _id: false }
)

const profileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'], default: 'prefer_not_to_say' },
    heightCm: { type: Number },
    currentWeightKg: { type: Number },
    targetWeightKg: { type: Number },
    bodyFatPct: { type: Number },
    occupation: { type: String },
    activityLevel: { type: String, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'], default: 'moderate' },
    country: { type: String },
    timezone: { type: String },

    fitnessExperience: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'professional'], default: 'beginner' },
    yearsTraining: { type: Number, default: 0 },
    gymAccess: { type: String, enum: ['home_gym', 'commercial_gym', 'both', 'no_equipment'], default: 'commercial_gym' },
    equipmentAvailable: { type: [String], default: [] },
    trainingDaysPerWeek: { type: Number, default: 3 },
    workoutDurationMinutes: { type: Number, default: 60 },

    goals: { type: [String], default: [] },
    dreamPhysique: { type: String },
    customGoal: { type: String },

    health: { type: healthSchema, default: () => ({}) },

    unitSystem: { type: String, enum: ['metric', 'imperial'], default: 'metric' },

    privacy: { type: privacySchema, default: () => ({}) },
  },
  { timestamps: true }
)

export type ProfileDocument = InferSchemaType<typeof profileSchema>
export const Profile = model('Profile', profileSchema)
