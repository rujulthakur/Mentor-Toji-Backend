import { Schema, model, type InferSchemaType } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { ROLES } from '../constants/index.js'

/**
 * This is deliberately a thin identity/account record — the full fitness
 * profile (goals, measurements, equipment, health questions, etc. from the
 * onboarding wizard) belongs to a separate `Profile` document in the
 * `users` module once that's built, referenced by userId. Keeping auth
 * concerns and profile data apart means the auth module never needs to
 * change shape when onboarding fields evolve.
 */
const userSchema = new Schema(
  {
    uuid: { type: String, default: uuidv4, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, trim: true },
    avatarUrl: { type: String },

    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },

    // Passwordless by default (email OTP is the primary login path). This
    // stays optional so a future coach/admin password-based login can reuse
    // the same collection without a migration.
    passwordHash: { type: String, select: false },

    // Google's stable `sub` claim for accounts that signed in (or later
    // linked) via Google Sign-In. Sparse + unique so OTP-only users (no
    // Google link) don't collide on a shared `null`.
    googleId: { type: String, unique: true, sparse: true, index: true },

    emailVerifiedAt: { type: Date, default: null },
    onboardingCompleted: { type: Boolean, default: false },

    lastLoginAt: { type: Date },

    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

// Soft-deleted users should never show up in normal lookups.
userSchema.index({ email: 1, deletedAt: 1 })

export type UserDocument = InferSchemaType<typeof userSchema>
export const User = model('User', userSchema)
