import { Schema, model, type InferSchemaType } from 'mongoose'

/**
 * Master exercise database. Read-mostly collection — seeded once via
 * `npm run seed:exercises` (see src/database/seedExercises.ts) and grown
 * over time from a CSV/admin tool. Workouts reference documents in this
 * collection by exerciseId; they never duplicate exercise metadata.
 */
const exerciseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: '' },

    primaryMuscle: { type: String, required: true, index: true },
    secondaryMuscles: { type: [String], default: [] },

    equipment: { type: String, required: true, index: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    movementPattern: { type: String, required: true, index: true },

    instructions: { type: [String], default: [] },
    videoUrl: { type: String },
    imageUrl: { type: String },
    aliases: { type: [String], default: [] },

    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

exerciseSchema.index({ name: 'text', aliases: 'text' })

export type ExerciseDocument = InferSchemaType<typeof exerciseSchema>
export const Exercise = model('Exercise', exerciseSchema)
