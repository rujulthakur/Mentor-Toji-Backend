import type { NextFunction, Request, Response } from 'express'
import { COOKIE_NAMES } from '../constants/index.js'
import { verifyAccessToken } from '../utils/jwt.js'
import { AuthenticationError } from '../utils/ApiError.js'

/**
 * Requires a valid access token cookie. Use on any route that must be
 * logged in. Distinct from `GET /auth/verify`, which is allowed to return
 * "not logged in" gracefully instead of throwing — this middleware is for
 * protecting actual resource routes.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN]
  if (!token) {
    throw new AuthenticationError('Not authenticated')
  }
  try {
    req.user = verifyAccessToken(token)
    next()
  } catch {
    throw new AuthenticationError('Invalid or expired session')
  }
}
