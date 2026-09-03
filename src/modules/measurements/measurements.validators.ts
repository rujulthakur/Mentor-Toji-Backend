import { z } from 'zod'

export const createMeasurementSchema = z.object({
  date: z.string().or(z.date()),
  weightKg: z.number().positive(),
  bodyFatPct: z.number().min(0).max(100).optional(),
  bmi: z.number().positive().optional(),
  muscleMassKg: z.number().positive().optional(),
  chest: z.number().positive().optional(),
  waist: z.number().positive().optional(),
  hip: z.number().positive().optional(),
  neck: z.number().positive().optional(),
  shoulders: z.number().positive().optional(),
  leftArm: z.number().positive().optional(),
  rightArm: z.number().positive().optional(),
  leftThigh: z.number().positive().optional(),
  rightThigh: z.number().positive().optional(),
  leftCalf: z.number().positive().optional(),
  rightCalf: z.number().positive().optional(),
  forearm: z.number().positive().optional(),
  notes: z.string().optional(),
})

export const updateMeasurementSchema = createMeasurementSchema.partial()

export const listMeasurementsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export const measurementIdParamSchema = z.object({ id: z.string().min(1) })

export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>
export type UpdateMeasurementInput = z.infer<typeof updateMeasurementSchema>
export type ListMeasurementsQuery = z.infer<typeof listMeasurementsQuerySchema>
