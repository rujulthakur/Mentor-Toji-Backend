import { Schema, model, type InferSchemaType } from 'mongoose'

const measurementSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, index: true },

    weightKg: { type: Number, required: true },
    bodyFatPct: { type: Number },
    bmi: { type: Number },
    muscleMassKg: { type: Number },

    chest: { type: Number },
    waist: { type: Number },
    hip: { type: Number },
    neck: { type: Number },
    shoulders: { type: Number },
    leftArm: { type: Number },
    rightArm: { type: Number },
    leftThigh: { type: Number },
    rightThigh: { type: Number },
    leftCalf: { type: Number },
    rightCalf: { type: Number },
    forearm: { type: Number },

    notes: { type: String },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

measurementSchema.index({ userId: 1, date: -1 })

export type MeasurementDocument = InferSchemaType<typeof measurementSchema>
export const Measurement = model('Measurement', measurementSchema)
