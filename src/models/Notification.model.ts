import { Schema, model, type InferSchemaType } from 'mongoose'

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['workout_reminder', 'hydration', 'weekly_summary', 'monthly_summary', 'pr_celebration', 'streak', 'recovery'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
)

notificationSchema.index({ userId: 1, createdAt: -1 })

export type NotificationDocument = InferSchemaType<typeof notificationSchema>
export const Notification = model('Notification', notificationSchema)
