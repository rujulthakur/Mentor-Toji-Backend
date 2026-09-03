import { usersService } from '../users/users.service.js'
import { workoutsRepository } from '../workouts/workouts.repository.js'
import { measurementsRepository } from '../measurements/measurements.repository.js'

/**
 * Pulls everything the system prompt needs so the AI never has to ask the
 * user to repeat themselves: profile, goals, health/injuries, recent
 * workout history, latest measurements, and current PRs. Called fresh
 * before every single Grok request — the AI has no memory of its own,
 * the backend IS its memory.
 */
export async function buildUserContext(userId: string) {
  const [profile, recentWorkouts, latestMeasurement, personalRecords, streak] = await Promise.all([
    usersService.getMe(userId).catch(() => null),
    workoutsRepository.find(userId, { page: 1, limit: 8 } as never),
    measurementsRepository.latest(userId),
    workoutsRepository.listPersonalRecords(userId),
    undefined,
  ])

  return {
    profile: profile
      ? {
          name: profile.name,
          age: profile.age,
          gender: profile.gender,
          heightCm: profile.heightCm,
          currentWeightKg: profile.currentWeightKg,
          targetWeightKg: profile.targetWeightKg,
          fitnessExperience: profile.fitnessExperience,
          trainingDaysPerWeek: profile.trainingDaysPerWeek,
          workoutDurationMinutes: profile.workoutDurationMinutes,
          gymAccess: profile.gymAccess,
          equipmentAvailable: profile.equipmentAvailable,
          goals: profile.goals,
          dreamPhysique: profile.dreamPhysique,
          injuries: profile.health?.injuries ?? [],
          medicalConditions: profile.health?.medicalConditions ?? [],
          jointPain: profile.health?.jointPain ?? [],
          exerciseRestrictions: profile.health?.exerciseRestrictions ?? [],
          sleepHours: profile.health?.sleepHours,
          stressLevel: profile.health?.stressLevel,
        }
      : null,
    recentWorkouts: recentWorkouts.items.map((w) => ({
      date: w.date,
      name: w.name,
      status: w.status,
      exercises: (w.exercises as unknown as Array<{ exerciseName: string; sets: Array<{ weightKg: number; reps: number }> }>).map((e) => ({
        name: e.exerciseName,
        sets: e.sets.map((s) => `${s.weightKg}kg x ${s.reps}`),
      })),
    })),
    latestMeasurement: latestMeasurement
      ? {
          date: latestMeasurement.date,
          weightKg: latestMeasurement.weightKg,
          bodyFatPct: latestMeasurement.bodyFatPct,
        }
      : null,
    personalRecords: personalRecords.map((pr) => ({
      exercise: pr.exerciseName,
      weightKg: pr.weightKg,
      reps: pr.reps,
      estimatedOneRepMax: pr.estimatedOneRepMax,
      date: pr.date,
    })),
  }
}

export type UserContext = Awaited<ReturnType<typeof buildUserContext>>
