import { v4 as uuidv4 } from 'uuid'
import { NotFoundError, ValidationError } from '../../utils/ApiError.js'
import { callGrok } from '../ai/grokClient.js'
import { buildMealParsePrompt } from './nutrition.promptBuilder.js'
import { nutritionRepository, toDayKey } from './nutrition.repository.js'
import { usersService } from '../users/users.service.js'
import {
  EMPTY_MACROS,
  EMPTY_MICRONUTRIENTS,
  MICRONUTRIENT_RDA,
  type Macros,
  type Micronutrients,
} from './nutrition.constants.js'
import type { LogMealInput, EditMealInput, RangeQuery } from './nutrition.validators.js'

// ---------- AI parsing ----------

interface ParsedItem {
  name: string
  quantity: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  sugarG: number
  sodiumMg: number
}

interface ParsedMealResponse {
  valid: boolean
  error: string | null
  mealTypeGuess: string
  items: ParsedItem[]
  micronutrients: Micronutrients
  insight: string
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : 0
}

/** Grok/Groq occasionally wraps JSON in ```json fences or adds a leading
 * sentence despite instructions — strip anything before the first `{` and
 * after the last `}` before parsing, rather than failing the whole request
 * over cosmetic formatting. */
function extractJson(raw: string): unknown {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) {
    throw new Error('AI response did not contain JSON')
  }
  return JSON.parse(raw.slice(start, end + 1))
}

function normalizeParsedMeal(raw: unknown): ParsedMealResponse {
  const obj = (raw ?? {}) as Record<string, unknown>
  const items = Array.isArray(obj.items) ? obj.items : []
  const micro = (obj.micronutrients ?? {}) as Record<string, unknown>

  // Default to valid=true when the field is missing entirely, so a model
  // response that forgot the flag (but still returned real items) doesn't
  // get rejected — only an explicit `false` (or zero parsed items) blocks
  // the meal from being logged.
  const valid = obj.valid !== false && items.length > 0

  return {
    valid,
    error: typeof obj.error === 'string' && obj.error.trim() ? obj.error.trim() : null,
    mealTypeGuess: typeof obj.mealTypeGuess === 'string' ? obj.mealTypeGuess : 'snack',
    items: items.map((it) => {
      const i = (it ?? {}) as Record<string, unknown>
      return {
        name: typeof i.name === 'string' && i.name.trim() ? i.name.trim() : 'Unknown item',
        quantity: typeof i.quantity === 'string' ? i.quantity : '',
        calories: num(i.calories),
        proteinG: num(i.proteinG),
        carbsG: num(i.carbsG),
        fatG: num(i.fatG),
        fiberG: num(i.fiberG),
        sugarG: num(i.sugarG),
        sodiumMg: num(i.sodiumMg),
      }
    }),
    micronutrients: Object.fromEntries(
      Object.keys(MICRONUTRIENT_RDA).map((k) => [k, num(micro[k])])
    ) as Micronutrients,
    insight: typeof obj.insight === 'string' ? obj.insight : '',
  }
}

async function parseMealWithAI(text: string, mealTypeHint?: string): Promise<ParsedMealResponse> {
  const messages = buildMealParsePrompt(text, mealTypeHint)
  const result = await callGrok(messages)
  const json = extractJson(result.content)
  const parsed = normalizeParsedMeal(json)
  if (!parsed.valid) {
    throw new ValidationError(parsed.error || "That doesn't look like a food item — try describing what you ate.")
  }
  return parsed
}

// ---------- macro math ----------

function sumMacros(items: Array<{ macros: Macros }>): Macros {
  return items.reduce<Macros>(
    (acc, it) => ({
      calories: acc.calories + it.macros.calories,
      proteinG: acc.proteinG + it.macros.proteinG,
      carbsG: acc.carbsG + it.macros.carbsG,
      fatG: acc.fatG + it.macros.fatG,
      fiberG: acc.fiberG + it.macros.fiberG,
      sugarG: acc.sugarG + it.macros.sugarG,
      sodiumMg: acc.sodiumMg + it.macros.sodiumMg,
    }),
    { ...EMPTY_MACROS }
  )
}

function sumMicronutrients(list: Micronutrients[]): Micronutrients {
  const totals = { ...EMPTY_MICRONUTRIENTS }
  for (const m of list) {
    for (const key of Object.keys(totals) as Array<keyof Micronutrients>) {
      totals[key] += m[key] ?? 0
    }
  }
  return totals
}

/** Recomputes the day-level totals/micronutrients from its meals array —
 * called after every mutation so the stored aggregate never drifts from
 * the per-meal data. */
function recomputeDay(log: { meals: Array<{ totals: Macros; micronutrients: Micronutrients }> }) {
  return {
    totals: sumMacros(log.meals.map((m) => ({ macros: m.totals }))),
    micronutrients: sumMicronutrients(log.meals.map((m) => m.micronutrients)),
  }
}

// ---------- goal calculation ----------

export interface NutritionGoals {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  sugarG: number
  sodiumMg: number
  waterMl: number
}

const ACTIVITY_MULTIPLIER: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

/** Mifflin-St Jeor BMR -> activity-adjusted TDEE -> goal-direction
 * adjustment -> macro split. Falls back to sane population-average
 * defaults if the user hasn't completed onboarding yet, so the dashboard
 * never shows a blank/zero goal. */
async function computeGoals(userId: string): Promise<NutritionGoals> {
  const profile = await usersService.getMe(userId).catch(() => null)

  const weightKg = profile?.currentWeightKg || 70
  const heightCm = profile?.heightCm || 170
  const age = profile?.age || 28
  const gender = profile?.gender || 'prefer_not_to_say'
  const activity = ACTIVITY_MULTIPLIER[profile?.activityLevel ?? 'moderate'] ?? 1.55
  const goals = profile?.goals ?? []

  const bmr =
    gender === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : gender === 'female'
        ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
        : 10 * weightKg + 6.25 * heightCm - 5 * age - 78 // midpoint offset when gender isn't specified

  let tdee = bmr * activity

  if (goals.includes('lose_fat') || goals.includes('beach_body')) tdee *= 0.85
  else if (goals.includes('build_muscle') || goals.includes('gain_weight') || goals.includes('lean_bulk')) tdee *= 1.12

  const calories = Math.round(tdee / 10) * 10
  const proteinG = Math.round(weightKg * 1.8)
  const fatCalories = calories * 0.25
  const fatG = Math.round(fatCalories / 9)
  const proteinCalories = proteinG * 4
  const carbsG = Math.max(0, Math.round((calories - proteinCalories - fatCalories) / 4))
  const fiberG = Math.round((calories / 1000) * 14)
  const sugarG = Math.round((calories * 0.1) / 4)

  return {
    calories,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    sugarG,
    sodiumMg: 2300,
    waterMl: Math.round(weightKg * 35),
  }
}

// ---------- rule-based day insights (deterministic, no extra AI call) ----------

function buildDayInsights(totals: Macros, goals: NutritionGoals, mealCount: number): string[] {
  if (mealCount === 0) return ['Log your first meal today and I\u2019ll start tracking your progress.']

  const insights: string[] = []
  const proteinGap = goals.proteinG - totals.proteinG
  const calorieGap = goals.calories - totals.calories

  if (proteinGap > 15) insights.push(`You're ${Math.round(proteinGap)}g below your protein goal — consider a protein-rich snack.`)
  else if (proteinGap < -10) insights.push(`You've exceeded your protein goal by ${Math.round(-proteinGap)}g — solid work.`)

  if (totals.sodiumMg > goals.sodiumMg) insights.push(`You've exceeded your sodium target by ${Math.round(totals.sodiumMg - goals.sodiumMg)}mg today.`)

  if (totals.fiberG < goals.fiberG * 0.6 && mealCount >= 2) insights.push('Your fiber intake is lower than recommended — a serving of vegetables or fruit would help.')

  if (totals.sugarG > goals.sugarG) insights.push(`Sugar intake is running high today (${Math.round(totals.sugarG)}g vs a ${goals.sugarG}g target).`)

  if (calorieGap > 400) insights.push(`You still have about ${Math.round(calorieGap)} calories left toward today's goal.`)
  else if (calorieGap < -200) insights.push(`You're ${Math.round(-calorieGap)} calories over today's goal.`)

  if (insights.length === 0) insights.push('Your macros are well balanced so far today — keep it up.')

  return insights
}

// ---------- public service ----------

function serializeLog(log: any, goals: NutritionGoals) {
  return {
    id: String(log._id),
    date: log.date,
    meals: log.meals,
    totals: log.totals,
    micronutrients: log.micronutrients,
    waterMl: log.waterMl,
    goals,
    insights: buildDayInsights(log.totals, goals, log.meals.length),
  }
}

export const nutritionService = {
  async getDay(userId: string, dateStr?: string) {
    const log = await nutritionRepository.findOrCreate(userId, dateStr)
    const goals = await computeGoals(userId)
    return serializeLog(log, goals)
  },

  async getGoals(userId: string) {
    return computeGoals(userId)
  },

  async addMeal(userId: string, input: LogMealInput) {
    const parsed = await parseMealWithAI(input.text, input.mealType)

    const items = parsed.items.map((it) => ({
      id: uuidv4(),
      name: it.name,
      quantity: it.quantity,
      macros: {
        calories: it.calories,
        proteinG: it.proteinG,
        carbsG: it.carbsG,
        fatG: it.fatG,
        fiberG: it.fiberG,
        sugarG: it.sugarG,
        sodiumMg: it.sodiumMg,
      },
    }))

    const mealType = input.mealType ?? (['breakfast', 'pre_workout', 'lunch', 'snack', 'dinner', 'late_night'].includes(parsed.mealTypeGuess) ? parsed.mealTypeGuess : 'snack')

    const log = await nutritionRepository.findOrCreate(userId, input.date)

    // If this meal type already has a card for the day (e.g. bananas were
    // logged for breakfast this morning and chapatis are added to breakfast
    // this afternoon), fold the new items into that existing card instead
    // of pushing a second "Breakfast" section for the same day.
    const existing = log.meals.find((m) => m.mealType === mealType)

    let meal: (typeof log.meals)[number]
    if (existing) {
      existing.rawText = existing.rawText ? `${existing.rawText}; ${input.text}` : input.text
      existing.items = [...existing.items, ...items] as never
      existing.totals = sumMacros(existing.items as unknown as Array<{ macros: Macros }>) as never
      existing.micronutrients = sumMicronutrients([existing.micronutrients, parsed.micronutrients]) as never
      existing.aiNotes = parsed.insight || existing.aiNotes
      meal = existing
    } else {
      meal = {
        id: uuidv4(),
        mealType,
        time: new Date().toISOString().slice(11, 16),
        rawText: input.text,
        items,
        totals: sumMacros(items),
        micronutrients: parsed.micronutrients,
        aiNotes: parsed.insight,
        createdAt: new Date(),
      } as never
      log.meals.push(meal as never)
    }

    const { totals, micronutrients } = recomputeDay(log as never)
    log.totals = totals as never
    log.micronutrients = micronutrients as never
    await log.save()

    const goals = await computeGoals(userId)
    return { meal, log: serializeLog(log, goals) }
  },

  async editMeal(userId: string, dateStr: string | undefined, mealId: string, input: EditMealInput) {
    const log = await nutritionRepository.findByDate(userId, dateStr)
    if (!log) throw new NotFoundError('No nutrition log for that date')
    const meal = log.meals.find((m) => m.id === mealId)
    if (!meal) throw new NotFoundError('Meal not found')

    const parsed = await parseMealWithAI(input.text, input.mealType ?? meal.mealType)
    const items = parsed.items.map((it) => ({
      id: uuidv4(),
      name: it.name,
      quantity: it.quantity,
      macros: {
        calories: it.calories,
        proteinG: it.proteinG,
        carbsG: it.carbsG,
        fatG: it.fatG,
        fiberG: it.fiberG,
        sugarG: it.sugarG,
        sodiumMg: it.sodiumMg,
      },
    }))

    meal.rawText = input.text
    if (input.mealType) meal.mealType = input.mealType
    meal.items = items as never
    meal.totals = sumMacros(items) as never
    meal.micronutrients = parsed.micronutrients as never
    meal.aiNotes = parsed.insight

    const { totals, micronutrients } = recomputeDay(log as never)
    log.totals = totals as never
    log.micronutrients = micronutrients as never
    await log.save()

    const goals = await computeGoals(userId)
    return serializeLog(log, goals)
  },

  async deleteMeal(userId: string, dateStr: string | undefined, mealId: string) {
    const log = await nutritionRepository.findByDate(userId, dateStr)
    if (!log) throw new NotFoundError('No nutrition log for that date')
    const before = log.meals.length
    log.meals = log.meals.filter((m) => m.id !== mealId) as never
    if (log.meals.length === before) throw new NotFoundError('Meal not found')

    const { totals, micronutrients } = recomputeDay(log as never)
    log.totals = totals as never
    log.micronutrients = micronutrients as never
    await log.save()

    const goals = await computeGoals(userId)
    return serializeLog(log, goals)
  },

  async duplicateMeal(userId: string, dateStr: string | undefined, mealId: string) {
    const log = await nutritionRepository.findOrCreate(userId, dateStr)
    const meal = log.meals.find((m) => m.id === mealId)
    if (!meal) throw new NotFoundError('Meal not found')

    const clone = {
      ...JSON.parse(JSON.stringify(meal)),
      id: uuidv4(),
      time: new Date().toISOString().slice(11, 16),
      createdAt: new Date(),
    }
    log.meals.push(clone as never)

    const { totals, micronutrients } = recomputeDay(log as never)
    log.totals = totals as never
    log.micronutrients = micronutrients as never
    await log.save()

    const goals = await computeGoals(userId)
    return serializeLog(log, goals)
  },

  async listLogs(userId: string, query: RangeQuery) {
    return nutritionRepository.findRange(userId, query.from, query.to, query.page, query.limit)
  },

  async weeklyAnalytics(userId: string) {
    const days = await nutritionRepository.recentDays(userId, 7)
    const goals = await computeGoals(userId)
    return buildAnalytics(days, goals)
  },

  async monthlyAnalytics(userId: string) {
    const days = await nutritionRepository.recentDays(userId, 30)
    const goals = await computeGoals(userId)
    return buildAnalytics(days, goals)
  },
}

function buildAnalytics(days: Array<{ date: Date; totals: Macros; meals: unknown[] }>, goals: NutritionGoals) {
  const logged = days.filter((d) => d.meals.length > 0)

  if (logged.length === 0) {
    return {
      days: days.map((d) => ({ date: d.date, calories: 0, protein: 0 })),
      averageCalories: 0,
      averageProtein: 0,
      macroConsistency: 0,
      nutritionScore: 0,
      goalAdherencePct: 0,
      cheatMeals: 0,
      bestDay: null,
      worstDay: null,
      trend: 'flat' as const,
    }
  }

  const avg = (fn: (m: Macros) => number) => logged.reduce((s, d) => s + fn(d.totals), 0) / logged.length
  const averageCalories = Math.round(avg((m) => m.calories))
  const averageProtein = Math.round(avg((m) => m.proteinG))

  // Consistency: how tightly calorie intake clusters around the mean (lower stdev = higher score).
  const variance = logged.reduce((s, d) => s + (d.totals.calories - averageCalories) ** 2, 0) / logged.length
  const stdev = Math.sqrt(variance)
  const macroConsistency = Math.max(0, Math.round(100 - (stdev / Math.max(goals.calories, 1)) * 100))

  const dayScore = (m: Macros) => {
    const calScore = 100 - Math.min(100, (Math.abs(m.calories - goals.calories) / Math.max(goals.calories, 1)) * 100)
    const proteinScore = Math.min(100, (m.proteinG / Math.max(goals.proteinG, 1)) * 100)
    return Math.round(calScore * 0.6 + proteinScore * 0.4)
  }

  const scored = logged.map((d) => ({ date: d.date, score: dayScore(d.totals), calories: d.totals.calories, protein: d.totals.proteinG }))
  const nutritionScore = Math.round(scored.reduce((s, d) => s + d.score, 0) / scored.length)
  const goalAdherencePct = Math.round(
    (logged.filter((d) => Math.abs(d.totals.calories - goals.calories) <= goals.calories * 0.15).length / logged.length) * 100
  )
  const cheatMeals = logged.filter((d) => d.totals.calories > goals.calories * 1.3).length

  const best = scored.reduce((a, b) => (b.score > a.score ? b : a))
  const worst = scored.reduce((a, b) => (b.score < a.score ? b : a))

  const firstHalf = scored.slice(0, Math.floor(scored.length / 2))
  const secondHalf = scored.slice(Math.floor(scored.length / 2))
  const firstAvg = firstHalf.length ? firstHalf.reduce((s, d) => s + d.calories, 0) / firstHalf.length : averageCalories
  const secondAvg = secondHalf.length ? secondHalf.reduce((s, d) => s + d.calories, 0) / secondHalf.length : averageCalories
  const trend = secondAvg > firstAvg * 1.05 ? 'up' : secondAvg < firstAvg * 0.95 ? 'down' : 'flat'

  return {
    days: days.map((d) => ({ date: d.date, calories: Math.round(d.totals.calories), protein: Math.round(d.totals.proteinG) })),
    averageCalories,
    averageProtein,
    macroConsistency,
    nutritionScore,
    goalAdherencePct,
    cheatMeals,
    bestDay: { date: best.date, score: best.score },
    worstDay: { date: worst.date, score: worst.score },
    trend: trend as 'up' | 'down' | 'flat',
  }
}
