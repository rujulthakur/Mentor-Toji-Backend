import { OAuth2Client } from 'google-auth-library'
import { env } from '../config/env.js'
import { AuthenticationError } from './ApiError.js'

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID)

export interface GoogleProfile {
  googleId: string
  email: string
  emailVerified: boolean
  name?: string
  avatarUrl?: string
}

/**
 * Verifies a Google Identity Services ID token (the credential posted by
 * the frontend's Google button) against Google's public keys and the
 * configured Client ID. Never trust an unverified ID token's claims —
 * `verifyIdToken` checks signature, issuer, audience, and expiry for us.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  let ticket
  try {
    ticket = await client.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID })
  } catch {
    throw new AuthenticationError('Invalid Google credential')
  }

  const payload = ticket.getPayload()
  if (!payload || !payload.sub || !payload.email) {
    throw new AuthenticationError('Invalid Google credential')
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: Boolean(payload.email_verified),
    name: payload.name,
    avatarUrl: payload.picture,
  }
}
