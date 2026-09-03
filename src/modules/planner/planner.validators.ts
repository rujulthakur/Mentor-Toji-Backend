import { z } from 'zod'
import { WEEKDAYS } from './planner.types.js'

export const weekdayParamSchema = z.object({
  day: z.enum(WEEKDAYS),
})

const plannerExerciseSchema = z.object({
  id: z.string().optional(),
  exerciseId: z.string().min(1),
  exerciseName: z.string().min(1),
  // order is authoritative from array position server-side, but accepted here too
  // so a client that already knows it (e.g. optimistic UI) doesn't need to strip it.
  order: z.number().int().min(0).optional(),
  targetSets: z.number().int().min(1).max(20).optional(),
  targetReps: z.number().int().min(1).max(100).optional(),
  notes: z.string().max(500).optional(),
})

export const updateDaySchema = z.object({
  exercises: z.array(plannerExerciseSchema).default([]),
})

export type UpdateDayInput = z.infer<typeof updateDaySchema>
