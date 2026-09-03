import type { NextFunction, Request, Response } from 'express'
import { redisClient } from '../config/redis.js'
import { REDIS_KEYS } from '../constants/index.js'
import { env } from '../config/env.js'
import { RateLimitError, ValidationError } from '../utils/ApiError.js'

/**
 * Caps how many OTPs a single email can request per hour. Keyed by email
 * (not IP) so it can't be bypassed by rotating IPs, and shared across every
 * server instance via Redis.
 */
export async function otpSendRateLimiter(req: Request, _res: Response, next: NextFunction) {
  const email = req.body?.email
  if (!email || typeof email !== 'string') throw new ValidationError('Email is required')

  const key = REDIS_KEYS.otpSendRate(email.toLowerCase())
  const attempts = await redisClient.incr(key)
  if (attempts === 1) await redisClient.expire(key, 3600)

  if (attempts > env.OTP_MAX_SEND_PER_HOUR) {
    throw new RateLimitError('Too many OTP requests for this email. Try again in an hour.')
  }
  next()
}

/**
 * Caps how many verify attempts are allowed for the OTP currently on file,
 * so a code can't be brute-forced (6 digits = only 1,000,000 possibilities).
 */
export async function otpVerifyRateLimiter(req: Request, _res: Response, next: NextFunction) {
  const email = req.body?.email
  if (!email || typeof email !== 'string') throw new ValidationError('Email is required')

  const key = REDIS_KEYS.otpVerifyAttempts(email.toLowerCase())
  const attempts = await redisClient.incr(key)
  if (attempts === 1) await redisClient.expire(key, env.OTP_TTL_SECONDS)

  if (attempts > env.OTP_MAX_VERIFY_ATTEMPTS) {
    throw new RateLimitError('Too many attempts. Request a new code.')
  }
  next()
}
