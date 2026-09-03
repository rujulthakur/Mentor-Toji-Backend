import { User, type UserDocument } from '../../models/User.model.js'
import { RefreshToken } from '../../models/RefreshToken.model.js'
import type { HydratedDocument } from 'mongoose'

export const authRepository = {
  findUserByEmail(email: string) {
    return User.findOne({ email, deletedAt: null })
  },

  findUserById(id: string) {
    return User.findOne({ _id: id, deletedAt: null })
  },

  createUser(email: string) {
    return User.create({ email })
  },

  findUserByGoogleId(googleId: string) {
    return User.findOne({ googleId, deletedAt: null })
  },

  createUserFromGoogle(params: { email: string; googleId: string; name?: string; avatarUrl?: string }) {
    return User.create({
      email: params.email,
      googleId: params.googleId,
      name: params.name,
      avatarUrl: params.avatarUrl,
      emailVerifiedAt: new Date(),
    })
  },

  /** Links a Google identity to an existing OTP-created account with the same email. */
  linkGoogleId(user: HydratedDocument<UserDocument>, params: { googleId: string; name?: string; avatarUrl?: string }) {
    user.googleId = params.googleId
    if (!user.name && params.name) user.name = params.name
    if (!user.avatarUrl && params.avatarUrl) user.avatarUrl = params.avatarUrl
    return user.save()
  },

  markEmailVerifiedAndLogin(user: HydratedDocument<UserDocument>) {
    if (!user.emailVerifiedAt) user.emailVerifiedAt = new Date()
    user.lastLoginAt = new Date()
    return user.save()
  },

  createRefreshToken(params: { userId: string; tokenHash: string; expiresAt: Date; userAgent?: string; ip?: string }) {
    return RefreshToken.create(params)
  },

  findActiveRefreshTokenByHash(tokenHash: string) {
    return RefreshToken.findOne({ tokenHash, revokedAt: null, expiresAt: { $gt: new Date() } })
  },

  revokeRefreshTokenById(id: string, replacedByTokenId?: string) {
    return RefreshToken.updateOne({ _id: id }, { revokedAt: new Date(), replacedByTokenId: replacedByTokenId ?? null })
  },

  revokeAllRefreshTokensForUser(userId: string) {
    return RefreshToken.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() })
  },
}
