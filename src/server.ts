import http from 'node:http'
import { app } from './app.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { connectDB, disconnectDB } from './config/db.js'
import { connectRedis, disconnectRedis } from './config/redis.js'
import { initSocket } from './socket/index.js'
import { startCronJobs } from './cron/index.js'
import { ensureExercisesSeeded } from './database/seedExercises.js'

// Without these, an unhandled promise rejection or a thrown error outside
// Express's request/response cycle (e.g. in a cron job, a stray callback,
// or a bug in a background task) silently kills the whole Node process.
// If that happens mid-deployment, every in-flight request gets no response
// at all — which is exactly what shows up in the browser as a raw 502 with
// no application-level error message to explain why. Logging loudly here,
// even though we still exit for uncaughtException (the process may be in a
// corrupted state), makes that failure mode visible in the server logs
// instead of a silent, unexplained outage.
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', reason)
})
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception — process will exit', err)
  process.exit(1)
})

async function bootstrap() {
  await connectDB()
  await connectRedis()

  // Self-healing: the exercise library is read-mostly and normally seeded via
  // `npm run seed:exercises`, but a fresh/empty Atlas cluster (new deploy,
  // new environment, cleared collection) would otherwise leave every search
  // and library screen on the frontend permanently empty with no obvious
  // error. Check once on boot and seed automatically if the collection is empty.
  await ensureExercisesSeeded()

  const server = http.createServer(app)
  initSocket(server)
  startCronJobs()

  server.listen(env.PORT, () => {
    logger.info(`🚀 GymTracker AI API listening on port ${env.PORT} (${env.NODE_ENV})`)
    logger.info(`   Routes mounted under ${env.API_PREFIX}`)
  })

  const shutdown = async (signal: string) => {
    logger.warn(`${signal} received, shutting down gracefully...`)
    server.close(async () => {
      await disconnectDB()
      await disconnectRedis()
      logger.info('Shutdown complete')
      process.exit(0)
    })
    // Force-exit if graceful shutdown hangs.
    setTimeout(() => process.exit(1), 10_000).unref()
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

bootstrap().catch((err) => {
  logger.error('Fatal error during startup', err)
  process.exit(1)
})
