import type { Request, Response } from 'express'
import { COOKIE_NAMES } from '../../constants/index.js'
import { sendResponse } from '../../utils/ApiResponse.js'
import { accessTokenCookieOptions, refreshTokenCookieOptions } from '../../utils/cookieOptions.js'
import { authService } from './auth.service.js'
import { verifyAccessToken } from '../../utils/jwt.js'
import type { SendOtpInput, VerifyOtpInput, GoogleLoginInput } from './auth.validators.js'

function setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string; accessTokenMaxAgeMs: number; refreshTokenMaxAgeMs: number }) {
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, tokens.accessToken, accessTokenCookieOptions(tokens.accessTokenMaxAgeMs))
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, tokens.refreshToken, refreshTokenCookieOptions(tokens.refreshTokenMaxAgeMs))
}

function clearAuthCookies(res: Response) {
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN)
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN)
}

export const authController = {
  async sendOtp(req: Request<unknown, unknown, SendOtpInput>, res: Response) {
    await authService.requestOtp(req.body.email)
    sendResponse(res, { message: 'Verification code sent to your email' })
  },

  async verifyOtp(req: Request<unknown, unknown, VerifyOtpInput>, res: Response) {
    const { user, tokens } = await authService.verifyOtp(req.body.email, req.body.otp, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    })
    setAuthCookies(res, tokens)
    sendResponse(res, { message: 'Logged in', data: { user } })
  },

  async googleLogin(req: Request<unknown, unknown, GoogleLoginInput>, res: Response) {
    const { user, tokens } = await authService.googleLogin(req.body.idToken, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    })
    setAuthCookies(res, tokens)
    sendResponse(res, { message: 'Logged in', data: { user } })
  },

  /**
   * Deliberately does not throw on "not logged in" — a fresh visitor
   * hitting this on app load is a normal case, not an error.
   */
  async verifySession(req: Request, res: Response) {
    const accessCookie = req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN]
    if (accessCookie) {
      try {
        const payload = verifyAccessToken(accessCookie)
        return sendResponse(res, {
          data: { loggedIn: true, user: { id: payload.sub, email: payload.email, role: payload.role } },
        })
      } catch {
        // fall through to refresh-token attempt
      }
    }

    const refreshCookie = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN]
    if (!refreshCookie) {
      return sendResponse(res, { data: { loggedIn: false } })
    }

    try {
      const { user, tokens } = await authService.refreshSession(refreshCookie, {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      })
      setAuthCookies(res, tokens)
      return sendResponse(res, { data: { loggedIn: true, user } })
    } catch {
      clearAuthCookies(res)
      return sendResponse(res, { data: { loggedIn: false } })
    }
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN])
    clearAuthCookies(res)
    sendResponse(res, { message: 'Logged out' })
  },
}
