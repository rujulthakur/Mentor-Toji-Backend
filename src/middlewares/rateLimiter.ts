import rateLimit from 'express-rate-limit'

/**
 * Coarse, in-memory protection for the whole API surface (per-instance).
 * The OTP endpoints layer a second, Redis-backed limiter on top (see
 * middlewares/otpRateLimiter.ts) because those need to be exact and shared
 * across instances, not just "good enough per pod".
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    data: null,
    meta: null,
    error: null,
  },
})
