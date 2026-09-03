import { z } from 'zod'

export const mealTypes = ['breakfast', 'pre_workout', 'lunch', 'snack', 'dinner', 'late_night'] as const

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')

export const logMealSchema = z.object({
  // Free-text description of what was eaten, e.g. "2 eggs and oats" — the
  // whole point of the feature is that this is the only thing the user
  // has to type.
  text: z.string().trim().min(2, 'Tell me what you ate').max(1500),
  mealType: z.enum(mealTypes).optional(),
  date: isoDate.optional(),
})

export const editMealSchema = z.object({
  text: z.string().trim().min(2, 'Tell me what you ate').max(1500),
  mealType: z.enum(mealTypes).optional(),
})

export const dateQuerySchema = z.object({
  date: isoDate.optional(),
})

export const rangeQuerySchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(90).default(30),
})

export const mealIdParamSchema = z.object({ mealId: z.string().min(1) })

export type LogMealInput = z.infer<typeof logMealSchema>
export type EditMealInput = z.infer<typeof editMealSchema>
export type DateQuery = z.infer<typeof dateQuerySchema>
export type RangeQuery = z.infer<typeof rangeQuerySchema>
