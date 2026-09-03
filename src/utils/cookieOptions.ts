import type { CookieOptions } from 'express'
import { isProduction } from '../config/env.js'

/**
 * `sameSite: 'none'` + `secure: true` in production because the frontend
 * and this API will typically live on different subdomains/hosts. In dev
 * both usually run on localhost, where 'lax' + non-secure works over http.
 */
export function accessTokenCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: maxAgeMs,
    path: '/',
  }
}

export function refreshTokenCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: maxAgeMs,
    path: '/',
  }
}
