/**
 * Seeds the Exercise collection from the bundled seed set.
 * Run with: npm run seed:exercises
 *
 * Safe to re-run — upserts by (name), so it never creates duplicates.
 * Growing the library later (toward the full 500+ target) just means
 * appending more entries to exercises.seed.json; no code changes needed.
 */
import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { connectDB, disconnectDB } from '../config/db.js'
import { Exercise } from '../models/Exercise.model.js'
import { logger } from '../config/logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface SeedExercise {
  name: string
  primaryMuscle: string
  secondaryMuscles?: string[]
  equipment: string
  difficulty: string
  movementPattern: string
  description: string
  instructions: string[]
}

async function seedFromFile(): Promise<{ created: number; updated: number }> {
  const raw = await readFile(path.join(__dirname, 'exercises.seed.json'), 'utf8')
  const seeds = JSON.parse(raw) as SeedExercise[]

  let created = 0
  let updated = 0

  for (const seed of seeds) {
    const result = await Exercise.updateOne(
      { name: seed.name },
      {
        $set: {
          name: seed.name,
          description: seed.description,
          primaryMuscle: seed.primaryMuscle,
          secondaryMuscles: seed.secondaryMuscles ?? [],
          equipment: seed.equipment,
          difficulty: seed.difficulty,
          movementPattern: seed.movementPattern,
          instructions: seed.instructions,
        },
      },
      { upsert: true }
    )
    if (result.upsertedCount > 0) created += 1
    else updated += 1
  }

  return { created, updated }
}

/**
 * Call on server boot (after connectDB). If the Exercise collection is
 * empty — a fresh Atlas cluster, a new environment, or someone clearing the
 * collection — this seeds it automatically so the app never silently shows
 * an empty exercise list. No-op (fast count query only) once already seeded.
 */
export async function ensureExercisesSeeded(): Promise<void> {
  try {
    const count = await Exercise.countDocuments()
    if (count > 0) {
      logger.info(`Exercise library already seeded (${count} exercises) — skipping auto-seed`)
      return
    }
    logger.warn('Exercise collection is empty — auto-seeding from bundled seed file…')
    const { created, updated } = await seedFromFile()
    logger.info(`✅ Exercise auto-seed complete — ${created} created, ${updated} already existed/updated`)
  } catch (err) {
    // Never let a seeding problem crash the whole API — log it and let the
    // server continue starting; the /exercises endpoint will just return an
    // empty list until this is resolved manually.
    logger.error('Exercise auto-seed failed', err)
  }
}

async function run() {
  await connectDB()
  const { created, updated } = await seedFromFile()
  logger.info(`✅ Exercise seed complete — ${created} created, ${updated} already existed/updated`)
  await disconnectDB()
  process.exit(0)
}

// Only run the standalone CLI flow when this file is executed directly
// (`npm run seed:exercises`), not when imported by server.ts.
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isMain) {
  run().catch((err) => {
    logger.error('Exercise seed failed', err)
    process.exit(1)
  })
}
