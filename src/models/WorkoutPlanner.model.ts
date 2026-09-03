import { Schema, model, type InferSchemaType } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

/**
 * A single planned exercise on a given weekday. Deliberately lightweight —
 * this is a *plan*, not a log. Actual performance (weight/reps/sets/notes/
 * completion) is only ever recorded on a WorkoutSession (see Workout.model.ts),
 * never here, so editing the planner can never rewrite workout history.
 */
const plannerExerciseSchema = new Schema(
  {
    id: { type: String, default: uuidv4 },
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
    exerciseName: { type: String, required: true },
    order: { type: Number, required: true, default: 0 },
    targetSets: { type: Number },
    targetReps: { type: Number },
    notes: { type: String },
  },
  { _id: false }
)

const daySchema = { type: [plannerExerciseSchema], default: [] }

const workoutPlannerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    days: {
      monday: daySchema,
      tuesday: daySchema,
      wednesday: daySchema,
      thursday: daySchema,
      friday: daySchema,
      saturday: daySchema,
      sunday: daySchema,
    },
  },
  { timestamps: true }
)

export type WorkoutPlannerDocument = InferSchemaType<typeof workoutPlannerSchema>
export const WorkoutPlanner = model('WorkoutPlanner', workoutPlannerSchema)
