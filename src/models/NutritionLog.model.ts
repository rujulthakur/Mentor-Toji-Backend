import { Schema, model, type InferSchemaType } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

/**
 * Macro breakdown shared by a single food item, a single meal's totals,
 * and a full day's totals — same shape at every level so summing is
 * trivial (see nutrition.service.ts `sumMacros`).
 */
const macroSchema = new Schema(
  {
    calories: { type: Number, default: 0 },
    proteinG: { type: Number, default: 0 },
    carbsG: { type: Number, default: 0 },
    fatG: { type: Number, default: 0 },
    fiberG: { type: Number, default: 0 },
    sugarG: { type: Number, default: 0 },
    sodiumMg: { type: Number, default: 0 },
  },
  { _id: false }
)

/**
 * Fixed set of micronutrients the AI is asked to estimate for every meal.
 * Kept as named numeric fields (rather than a free-form map) so RDA %
 * calculations on the frontend/service never have to guess a key exists.
 */
const micronutrientSchema = new Schema(
  {
    vitaminAMcg: { type: Number, default: 0 },
    vitaminBComplexMg: { type: Number, default: 0 },
    vitaminCMg: { type: Number, default: 0 },
    vitaminDMcg: { type: Number, default: 0 },
    vitaminEMg: { type: Number, default: 0 },
    vitaminKMcg: { type: Number, default: 0 },
    calciumMg: { type: Number, default: 0 },
    ironMg: { type: Number, default: 0 },
    magnesiumMg: { type: Number, default: 0 },
    potassiumMg: { type: Number, default: 0 },
    zincMg: { type: Number, default: 0 },
    phosphorusMg: { type: Number, default: 0 },
    seleniumMcg: { type: Number, default: 0 },
  },
  { _id: false }
)

const foodItemSchema = new Schema(
  {
    id: { type: String, default: uuidv4 },
    name: { type: String, required: true },
    quantity: { type: String, default: '' },
    macros: { type: macroSchema, default: () => ({}) },
  },
  { _id: false }
)

const mealSchema = new Schema(
  {
    id: { type: String, default: uuidv4 },
    mealType: { type: String, enum: ['breakfast', 'pre_workout', 'lunch', 'snack', 'dinner', 'late_night'], required: true },
    time: { type: String, default: '' },
    rawText: { type: String, required: true },
    items: { type: [foodItemSchema], default: [] },
    totals: { type: macroSchema, default: () => ({}) },
    micronutrients: { type: micronutrientSchema, default: () => ({}) },
    aiNotes: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const nutritionLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Normalized to UTC midnight of the calendar day the client sent
    // (see nutrition.service.ts `toDayKey`) — never a live timestamp, so a
    // user always has exactly one log document per day regardless of when
    // during the day they log meals.
    date: { type: Date, required: true, index: true },
    meals: { type: [mealSchema], default: [] },
    totals: { type: macroSchema, default: () => ({}) },
    micronutrients: { type: micronutrientSchema, default: () => ({}) },
    waterMl: { type: Number, default: 0 },
  },
  { timestamps: true }
)

nutritionLogSchema.index({ userId: 1, date: -1 }, { unique: true })

export type NutritionLogDocument = InferSchemaType<typeof nutritionLogSchema>
export const NutritionLog = model('NutritionLog', nutritionLogSchema)
