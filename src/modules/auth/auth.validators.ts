import { z } from 'zod'

export const sendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
})

export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  otp: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
})

export const googleLoginSchema = z.object({
  // Google ID tokens are signed JWTs, always well over 100 chars.
  idToken: z.string().min(50, 'Missing or malformed Google credential'),
})

export type SendOtpInput = z.infer<typeof sendOtpSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>
