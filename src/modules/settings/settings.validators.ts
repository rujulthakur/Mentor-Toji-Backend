import { z } from 'zod'

export const updateSettingsSchema = z.object({
  unitSystem: z.enum(['metric', 'imperial']).optional(),
  darkMode: z.boolean().optional(),
  notifications: z
    .object({
      workoutReminder: z.boolean().optional(),
      hydrationReminder: z.boolean().optional(),
      weeklySummary: z.boolean().optional(),
      monthlySummary: z.boolean().optional(),
      prCelebration: z.boolean().optional(),
      streakReminder: z.boolean().optional(),
      recoveryReminder: z.boolean().optional(),
    })
    .partial()
    .optional(),
  aiSettings: z
    .object({
      tone: z.enum(['concise', 'detailed', 'motivational']).optional(),
      autoSuggestDeload: z.boolean().optional(),
    })
    .partial()
    .optional(),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
