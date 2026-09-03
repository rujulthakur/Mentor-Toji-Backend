export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

export type Weekday = (typeof WEEKDAYS)[number]

export interface PlannerExercise {
  id?: string
  exerciseId: string
  exerciseName: string
  order: number
  targetSets?: number
  targetReps?: number
  notes?: string
}
