export interface WorkoutSet {
  id?: string
  setNumber: number
  weightKg: number
  reps: number
  rpe?: number
  restSeconds?: number
  tempo?: string
  isWarmup: boolean
  isFailure: boolean
  isDropSet: boolean
  completed: boolean
  notes?: string
}

export interface WorkoutExerciseEntry {
  id?: string
  exerciseId: string
  exerciseName: string
  supersetGroup?: string
  sets: WorkoutSet[]
  notes?: string
}
