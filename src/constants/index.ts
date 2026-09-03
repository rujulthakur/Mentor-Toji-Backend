export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const

export const REDIS_KEYS = {
  otp: (email: string) => `otp:${email}`,
  otpSendRate: (email: string) => `otp-rate:send:${email}`,
  otpVerifyAttempts: (email: string) => `otp-rate:verify:${email}`,
} as const

export const ROLES = {
  USER: 'user',
  COACH: 'coach',
  ADMIN: 'admin',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]
