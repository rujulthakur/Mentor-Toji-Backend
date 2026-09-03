import { z } from 'zod'

export const uploadPhotoBodySchema = z.object({
  date: z.string().or(z.date()),
  angle: z.enum(['front', 'side', 'back']),
  weightKg: z.coerce.number().positive().optional(),
  bodyFatPct: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().optional(),
})

export const listPhotosQuerySchema = z.object({
  angle: z.enum(['front', 'side', 'back']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
})

export const photoIdParamSchema = z.object({ id: z.string().min(1) })

export type UploadPhotoBody = z.infer<typeof uploadPhotoBodySchema>
export type ListPhotosQuery = z.infer<typeof listPhotosQuerySchema>
