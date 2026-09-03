import cron from 'node-cron'
import { logger } from '../config/logger.js'
import { cleanupExpiredTokensJob } from './cleanupExpiredTokens.job.js'

/**
 * Only the token-cleanup job is real today. The rest of the spec's jobs
 * (daily/weekly/monthly analytics, streak updates, AI summaries, backups)
 * belong here once their owning modules (analytics, notifications, ai)
 * are built — add a `<name>.job.ts` next to this file and schedule it
 * below, following the same pattern.
 */
export function startCronJobs() {
  // Every hour, on the hour.
  cron.schedule('0 * * * *', () => {
    cleanupExpiredTokensJob().catch((err) => logger.error('[cron] cleanupExpiredTokensJob failed', err))
  })

  logger.info('⏱️  Cron jobs scheduled')
}
