import { Schema, model, type InferSchemaType } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const workoutSetSchema = new Schema(
  {
    id: { type: String, default: uuidv4 },
    setNumber: { type: Number, required: true },
    weightKg: { type: Number, required: true },
    reps: { type: Number, required: true },
    rpe: { type: Number },
    restSeconds: { type: Number },
    tempo: { type: String },
    isWarmup: { type: Boolean, default: false },
    isFailure: { type: Boolean, default: false },
    isDropSet: { type: Boolean, default: false },
    completed: { type: Boolean, default: true },
    notes: { type: String },
  },
  { _id: false }
)

const workoutExerciseEntrySchema = new Schema(
  {
    id: { type: String, default: uuidv4 },
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
    exerciseName: { type: String, required: true },
    supersetGroup: { type: String },
    sets: { type: [workoutSetSchema], default: [] },
    notes: { type: String },
  },
  { _id: false }
)

const workoutSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, index: true },
    name: { type: String, required: true },
    status: { type: String, enum: ['in_progress', 'completed', 'skipped'], default: 'in_progress' },
    durationMinutes: { type: Number },
    exercises: { type: [workoutExerciseEntrySchema], default: [] },
    caloriesBurned: { type: Number },
    notes: { type: String },
    mood: { type: String },
    energyLevel: { type: Number },
    recovery: { type: Number },

    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

workoutSessionSchema.index({ userId: 1, date: -1 })
workoutSessionSchema.index({ userId: 1, 'exercises.exerciseId': 1 })

export type WorkoutSessionDocument = InferSchemaType<typeof workoutSessionSchema>
export const WorkoutSession = model('WorkoutSession', workoutSessionSchema)
