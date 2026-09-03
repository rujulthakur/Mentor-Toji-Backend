import type { NextFunction, Request, Response } from 'express'
import { MulterError } from 'multer'
import { ZodError } from 'zod'
import { ApiError } from '../utils/ApiError.js'
import { logger } from '../config/logger.js'
import { isProduction } from '../config/env.js'

const MULTER_MESSAGES: Record<string, string> = {
  LIMIT_FILE_SIZE: 'That image is too large — max size is 15MB.',
  LIMIT_UNEXPECTED_FILE: 'Unexpected file field — expected a single "photo" field.',
}

/**
 * Single place every thrown error ends up. Controllers/services never
 * catch-and-format errors themselves — they just `throw new SomeApiError(...)`
 * (or let express-async-errors forward unexpected ones here).
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  // Multer throws its own error class (not an ApiError) for things like an
  // oversized file — without this it fell through to the generic 500 branch
  // below and, in production, showed the user an opaque "Something went
  // wrong" instead of the actual reason the upload was rejected.
  if (err instanceof MulterError) {
    return res.status(400).json({
      success: false,
      message: MULTER_MESSAGES[err.code] ?? err.message,
      data: null,
      meta: null,
      error: null,
    })
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: null,
      meta: null,
      error: err.flatten(),
    })
  }

  if (err instanceof ApiError) {
    if (!err.isOperational) {
      logger.error(`Unexpected ApiError on ${req.method} ${req.originalUrl}`, err)
    }
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
      meta: null,
      error: err.details ?? null,
    })
  }

  // Unknown/unhandled error — log full detail server-side, never leak internals to the client.
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err)
  return res.status(500).json({
    success: false,
    message: isProduction ? 'Something went wrong' : (err as Error)?.message || 'Internal server error',
    data: null,
    meta: null,
    error: isProduction ? null : { stack: (err as Error)?.stack },
  })
}
