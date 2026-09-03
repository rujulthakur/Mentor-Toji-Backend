import { RefreshToken } from '../models/RefreshToken.model.js'
import { logger } from '../config/logger.js'

/**
 * MongoDB's TTL index on `expiresAt` (see RefreshToken.model.ts) already
 * removes naturally-expired tokens on its own background sweep, but that
 * sweep can lag by up to 60s and doesn't touch tokens that were revoked
 * early (rotation, logout). This job clears both cases explicitly.
 */
export async function cleanupExpiredTokensJob() {
  const result = await RefreshToken.deleteMany({
    $or: [{ expiresAt: { $lt: new Date() } }, { revokedAt: { $ne: null } }],
  })
  if (result.deletedCount > 0) {
    logger.info(`[cron] Cleaned up ${result.deletedCount} expired/revoked refresh tokens`)
  }
}
