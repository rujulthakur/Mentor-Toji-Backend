import type { Response } from 'express'

interface SendOptions<T> {
  statusCode?: number
  message?: string
  data?: T
  meta?: Record<string, unknown>
}

/**
 * Every successful response in the API goes through this so the shape is
 * identical everywhere:
 *   { success, message, data, meta, error }
 */
export function sendResponse<T>(res: Response, options: SendOptions<T> = {}): Response {
  const { statusCode = 200, message = 'Success', data = null, meta = null } = options
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
    error: null,
  })
}
