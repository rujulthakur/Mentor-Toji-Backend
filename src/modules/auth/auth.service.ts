import { redisClient } from '../../config/redis.js'
import { REDIS_KEYS } from '../../constants/index.js'
import { env } from '../../config/env.js'
import { generateOtp } from '../../utils/generateOtp.js'
import { hashToken, parseDurationToMs } from '../../utils/hashToken.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken, type AccessTokenPayload } from '../../utils/jwt.js'
import { AuthenticationError } from '../../utils/ApiError.js'
import { sendMail } from '../../emails/mailer.js'
import { otpEmailTemplate } from '../../emails/otpEmailTemplate.js'
import { verifyGoogleIdToken } from '../../utils/googleAuth.js'
import { authRepository } from './auth.repository.js'
import type { Role } from '../../constants/index.js'

export interface PublicUser {
  id: string
  email: string
  name?: string
  avatarUrl?: string
  role: Role
  onboardingCompleted: boolean
}

function toPublicUser(user: {
  _id: unknown
  email: string
  name?: string | null
  avatarUrl?: string | null
  role: string
  onboardingCompleted?: boolean
}): PublicUser {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name ?? undefined,
    avatarUrl: user.avatarUrl ?? undefined,
    role: user.role as Role,
    onboardingCompleted: Boolean(user.onboardingCompleted),
  }
}

interface IssuedTokens {
  accessToken: string
  refreshToken: string
  accessTokenMaxAgeMs: number
  refreshTokenMaxAgeMs: number
}

async function issueTokenPair(payload: AccessTokenPayload, context: { userAgent?: string; ip?: string }): Promise<IssuedTokens> {
  const accessToken = signAccessToken(payload)

  // The refresh JWT needs to embed the DB row's id so a stolen/replayed
  // token can be revoked by id later — but we only get that id by writing
  // the row first. Create the row with a placeholder hash, then sign the
  // real token and patch the row's hash to match.
  const refreshTokenMaxAgeMs = parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN)
  const doc = await authRepository.createRefreshToken({
    userId: payload.sub,
    tokenHash: 'pending',
    expiresAt: new Date(Date.now() + refreshTokenMaxAgeMs),
    userAgent: context.userAgent,
    ip: context.ip,
  })

  const refreshToken = signRefreshToken({ sub: payload.sub, tokenId: String(doc._id) })
  doc.tokenHash = hashToken(refreshToken)
  await doc.save()

  return {
    accessToken,
    refreshToken,
    accessTokenMaxAgeMs: parseDurationToMs(env.JWT_ACCESS_EXPIRES_IN),
    refreshTokenMaxAgeMs,
  }
}

export const authService = {
  /** Step 1: generate + email a 6-digit OTP, stored in Redis with a TTL. */
  async requestOtp(email: string): Promise<void> {
    const otp = generateOtp()
    await redisClient.setEx(REDIS_KEYS.otp(email), env.OTP_TTL_SECONDS, otp)
    await sendMail(email, 'Your GymTracker AI login code', otpEmailTemplate(otp, { expiresInMinutes: Math.round(env.OTP_TTL_SECONDS / 60) }))
  },

  /**
   * Step 2: verify the code, upsert the user, and issue a fresh access +
   * refresh token pair. Returns everything the controller needs to set
   * cookies and respond — no cookie/response logic lives here.
   */
  async verifyOtp(email: string, otp: string, context: { userAgent?: string; ip?: string }) {
    const storedOtp = await redisClient.get(REDIS_KEYS.otp(email))
    if (!storedOtp || storedOtp !== otp) {
      throw new AuthenticationError('Invalid or expired code')
    }

    // One-time use: burn the code and reset the verify-attempt counter immediately.
    await redisClient.del(REDIS_KEYS.otp(email))
    await redisClient.del(REDIS_KEYS.otpVerifyAttempts(email))

    let user = await authRepository.findUserByEmail(email)
    if (!user) {
      user = await authRepository.createUser(email)
    }
    user = await authRepository.markEmailVerifiedAndLogin(user)

    const tokens = await issueTokenPair({ sub: String(user._id), email: user.email, role: user.role as Role }, context)

    return { user: toPublicUser(user), tokens }
  },

  /**
   * Google Sign-In. The frontend posts the ID token from Google Identity
   * Services; it's verified against Google's public keys here (signature +
   * audience + expiry), never trusted as-is. Same account model as OTP
   * login: if an account with this email already exists (e.g. created via
   * OTP), the Google identity is linked to it rather than creating a
   * duplicate user, so a person can use either login method afterward.
   */
  async googleLogin(idToken: string, context: { userAgent?: string; ip?: string }) {
    const profile = await verifyGoogleIdToken(idToken)
    if (!profile.emailVerified) {
      throw new AuthenticationError('Google account email is not verified')
    }

    let user = await authRepository.findUserByGoogleId(profile.googleId)
    if (!user) {
      const existingByEmail = await authRepository.findUserByEmail(profile.email)
      user = existingByEmail
        ? await authRepository.linkGoogleId(existingByEmail, {
            googleId: profile.googleId,
            name: profile.name,
            avatarUrl: profile.avatarUrl,
          })
        : await authRepository.createUserFromGoogle({
            email: profile.email,
            googleId: profile.googleId,
            name: profile.name,
            avatarUrl: profile.avatarUrl,
          })
    }
    user = await authRepository.markEmailVerifiedAndLogin(user)

    const tokens = await issueTokenPair({ sub: String(user._id), email: user.email, role: user.role as Role }, context)

    return { user: toPublicUser(user), tokens }
  },

  /**
   * Called by `GET /auth/verify`. Tries the access token first; if it's
   * missing/expired but a valid, non-revoked refresh token cookie is
   * present, silently rotates both tokens (refresh token rotation:
   * the old one is revoked the moment a new one is issued, so a replayed
   * stolen refresh token stops working after the legitimate client uses it
   * once more).
   */
  async refreshSession(refreshToken: string, context: { userAgent?: string; ip?: string }) {
    let payload
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch {
      throw new AuthenticationError('Session expired, please log in again')
    }

    const existing = await authRepository.findActiveRefreshTokenByHash(hashToken(refreshToken))
    if (!existing || String(existing._id) !== payload.tokenId) {
      // Token reuse/replay detected, or it was already rotated/revoked —
      // kill every session for this user as a precaution.
      await authRepository.revokeAllRefreshTokensForUser(payload.sub)
      throw new AuthenticationError('Session invalid, please log in again')
    }

    const user = await authRepository.findUserById(payload.sub)
    if (!user) throw new AuthenticationError('User no longer exists')

    const tokens = await issueTokenPair({ sub: String(user._id), email: user.email, role: user.role as Role }, context)
    await authRepository.revokeRefreshTokenById(String(existing._id), undefined)

    return { user: toPublicUser(user), tokens }
  },

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return
    try {
      const payload = verifyRefreshToken(refreshToken)
      await authRepository.revokeRefreshTokenById(payload.tokenId)
    } catch {
      // Already invalid/expired — nothing to revoke, logout still "succeeds".
    }
  },

  toPublicUser,
}
