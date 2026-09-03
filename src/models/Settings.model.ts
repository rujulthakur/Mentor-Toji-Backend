import { Schema, model, type InferSchemaType } from 'mongoose'

const settingsSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

    unitSystem: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
    darkMode: { type: Boolean, default: true },

    notifications: {
      workoutReminder: { type: Boolean, default: true },
      hydrationReminder: { type: Boolean, default: true },
      weeklySummary: { type: Boolean, default: true },
      monthlySummary: { type: Boolean, default: true },
      prCelebration: { type: Boolean, default: true },
      streakReminder: { type: Boolean, default: true },
      recoveryReminder: { type: Boolean, default: true },
    },

    aiSettings: {
      tone: { type: String, enum: ['concise', 'detailed', 'motivational'], default: 'concise' },
      autoSuggestDeload: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
)

export type SettingsDocument = InferSchemaType<typeof settingsSchema>
export const Settings = model('Settings', settingsSchema)
