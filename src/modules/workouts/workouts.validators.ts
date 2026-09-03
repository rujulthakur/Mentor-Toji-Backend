import { z } from 'zod'

const workoutSetSchema = z.object({
  id: z.string().optional(),
  setNumber: z.number().int().min(1),
  weightKg: z.number().min(0),
  reps: z.number().int().min(0),
  rpe: z.number().min(0).max(10).optional(),
  restSeconds: z.number().min(0).optional(),
  tempo: z.string().optional(),
  isWarmup: z.boolean().default(false),
  isFailure: z.boolean().default(false),
  isDropSet: z.boolean().default(false),
  completed: z.boolean().default(true),
  notes: z.string().optional(),
})

const workoutExerciseEntrySchema = z.object({
  id: z.string().optional(),
  exerciseId: z.string().min(1),
  exerciseName: z.string().min(1),
  supersetGroup: z.string().optional(),
  sets: z.array(workoutSetSchema).default([]),
  notes: z.string().optional(),
})

export const createWorkoutSchema = z.object({
  date: z.string().or(z.date()),
  name: z.string().min(1),
  status: z.enum(['in_progress', 'completed', 'skipped']).default('in_progress'),
  durationMinutes: z.number().min(0).optional(),
  exercises: z.array(workoutExerciseEntrySchema).default([]),
  caloriesBurned: z.number().min(0).optional(),
  notes: z.string().optional(),
  mood: z.string().optional(),
  energyLevel: z.number().min(1).max(5).optional(),
  recovery: z.number().min(1).max(5).optional(),
})

export const updateWorkoutSchema = createWorkoutSchema.partial()

export const listWorkoutsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  muscle: z.string().optional(),
  exerciseId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const workoutIdParamSchema = z.object({ id: z.string().min(1) })

export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>
export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>
export type ListWorkoutsQuery = z.infer<typeof listWorkoutsQuerySchema>
