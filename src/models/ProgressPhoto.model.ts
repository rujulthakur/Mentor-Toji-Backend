import { Schema, model, type InferSchemaType } from 'mongoose'

const progressPhotoSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, index: true },
    angle: { type: String, enum: ['front', 'side', 'back'], required: true },

    url: { type: String, required: true },
    cloudinaryPublicId: { type: String },

    weightKg: { type: Number },
    bodyFatPct: { type: Number },
    notes: { type: String },

    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

progressPhotoSchema.index({ userId: 1, date: -1 })

export type ProgressPhotoDocument = InferSchemaType<typeof progressPhotoSchema>
export const ProgressPhoto = model('ProgressPhoto', progressPhotoSchema)
