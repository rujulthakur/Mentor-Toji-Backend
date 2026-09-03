import type { UserContext } from './contextBuilder.js'
import type { GrokMessage } from './grokClient.js'

const SYSTEM_PROMPT = `You are GymTracker AI.

You are an elite strength coach, bodybuilding coach, exercise scientist, and sports physiologist.

You permanently remember the user's profile, workout history, injuries, goals, body measurements, previous conversations, progress charts, and personal records — because they are provided to you below on every single message. Never ask again for information already present in the context.

Always analyze the provided data before giving advice.
Recommend progressive overload whenever appropriate.
Detect plateaus.
Recommend deload weeks.
Recommend exercise substitutions.
Recommend recovery changes.
Recommend training volume and intensity adjustments.
Base every recommendation on scientific evidence.
Always explain WHY.
Never invent user data.
If data is missing, clearly state what additional information would improve your recommendation.
Be concise first, then provide detailed reasoning if requested.`

function formatContext(context: UserContext): string {
  const lines: string[] = []

  if (context.profile) {
    const p = context.profile
    lines.push(
      `USER PROFILE: ${p.name ?? 'Unnamed'}, age ${p.age ?? '?'}, ${p.gender ?? '?'}, ${p.heightCm ?? '?'}cm, ` +
        `current weight ${p.currentWeightKg ?? '?'}kg, target weight ${p.targetWeightKg ?? '?'}kg. ` +
        `Experience: ${p.fitnessExperience ?? '?'}. Trains ${p.trainingDaysPerWeek ?? '?'} days/week for ${p.workoutDurationMinutes ?? '?'} min. ` +
        `Gym access: ${p.gymAccess ?? '?'}. Equipment: ${(p.equipmentAvailable ?? []).join(', ') || 'not specified'}. ` +
        `Goals: ${(p.goals ?? []).join(', ') || 'not specified'}.${p.dreamPhysique ? ` Dream physique: ${p.dreamPhysique}.` : ''}`
    )
    const healthFlags = [
      p.injuries?.length ? `Injuries: ${p.injuries.join(', ')}` : null,
      p.medicalConditions?.length ? `Medical conditions: ${p.medicalConditions.join(', ')}` : null,
      p.jointPain?.length ? `Joint pain: ${p.jointPain.join(', ')}` : null,
      p.exerciseRestrictions?.length ? `Exercise restrictions: ${p.exerciseRestrictions.join(', ')}` : null,
      p.sleepHours ? `Sleep: ${p.sleepHours}h/night` : null,
      p.stressLevel ? `Stress level: ${p.stressLevel}/5` : null,
    ].filter(Boolean)
    if (healthFlags.length) lines.push(`HEALTH: ${healthFlags.join('. ')}.`)
  } else {
    lines.push('USER PROFILE: not yet completed onboarding — ask them to finish onboarding for personalized advice.')
  }

  if (context.latestMeasurement) {
    lines.push(
      `LATEST MEASUREMENT (${new Date(context.latestMeasurement.date).toISOString().slice(0, 10)}): ${context.latestMeasurement.weightKg}kg` +
        (context.latestMeasurement.bodyFatPct ? `, ${context.latestMeasurement.bodyFatPct}% body fat` : '')
    )
  }

  if (context.personalRecords.length) {
    lines.push(
      'CURRENT PERSONAL RECORDS: ' +
        context.personalRecords
          .slice(0, 15)
          .map((pr) => `${pr.exercise} ${pr.weightKg}kg x ${pr.reps} (est. 1RM ${pr.estimatedOneRepMax}kg)`)
          .join('; ')
    )
  }

  if (context.recentWorkouts.length) {
    lines.push('RECENT WORKOUT HISTORY (most recent first):')
    for (const w of context.recentWorkouts) {
      const date = new Date(w.date).toISOString().slice(0, 10)
      const exerciseLines = w.exercises.map((e) => `${e.name} [${e.sets.join(', ')}]`).join('; ')
      lines.push(`- ${date} "${w.name}" (${w.status}): ${exerciseLines || 'no exercises logged'}`)
    }
  } else {
    lines.push('RECENT WORKOUT HISTORY: none logged yet.')
  }

  return lines.join('\n')
}

export function buildMessages(context: UserContext, history: GrokMessage[], newMessage: string): GrokMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: formatContext(context) },
    ...history,
    { role: 'user', content: newMessage },
  ]
}
