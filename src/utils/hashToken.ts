import { createHash } from 'node:crypto'

/**
 * Refresh tokens are hashed before being stored (same principle as
 * passwords: if the DB leaks, the tokens in it should be useless). SHA-256
 * is fine here — unlike a password, a refresh token is already
 * high-entropy random data, so we don't need bcrypt's deliberate slowness,
 * and a fast deterministic hash lets us look tokens up by equality.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** ms helper for cookie/JWT maxAge math, e.g. parseDurationToMs('30d') */
export function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration)
  if (!match) return 0
  const value = Number(match[1])
  const unit = match[2]
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit as 's' | 'm' | 'h' | 'd']
  return value * unitMs
}
