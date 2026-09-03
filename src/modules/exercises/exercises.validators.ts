import { z } from 'zod'

export const listExercisesQuerySchema = z.object({
  q: z.string().trim().optional(),
  muscle: z.string().trim().optional(),
  equipment: z.string().trim().optional(),
  movementPattern: z.string().trim().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(100),
})

export const exerciseIdParamSchema = z.object({
  id: z.string().min(1),
})

export type ListExercisesQuery = z.infer<typeof listExercisesQuerySchema>
