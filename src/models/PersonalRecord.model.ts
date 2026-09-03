import { Schema, model, type InferSchemaType } from 'mongoose'

/**
 * One document per (user, exercise) — always holds the current best.
 * Written by the progressive-overload engine (see workouts.service.ts)
 * right after a completed workout is saved.
 */
const personalRecordSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
    exerciseName: { type: String, required: true },
    weightKg: { type: Number, required: true },
    reps: { type: Number, required: true },
    estimatedOneRepMax: { type: Number, required: true },
    date: { type: Date, required: true },
    previousRecordKg: { type: Number },
    workoutSessionId: { type: Schema.Types.ObjectId, ref: 'WorkoutSession' },
  },
  { timestamps: true }
)

personalRecordSchema.index({ userId: 1, exerciseId: 1 }, { unique: true })

export type PersonalRecordDocument = InferSchemaType<typeof personalRecordSchema>
export const PersonalRecord = model('PersonalRecord', personalRecordSchema)
