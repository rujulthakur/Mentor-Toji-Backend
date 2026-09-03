import 'dotenv/config'
import { z } from 'zod'

/**
 * Every environment variable the app touches is declared here and
 * validated once at boot. If something required is missing, the process
 * fails fast with a clear message instead of throwing a confusing error
 * three requests later.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_PREFIX: z.string().default('/api/v1'),

  // Frontend origin(s) allowed to send credentialed requests.
 CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
CLIENT_ORIGINS: z
  .string()
  .default('http://localhost:5173')
  .transform((val) => val.split(',').map((o) => o.trim())),

  // MongoDB Atlas
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required (MongoDB Atlas connection string)'),

  // Redis (OTP storage + rate limiting)
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Google Sign-In (Google Identity Services on the frontend posts an ID
  // token here for server-side verification; no client secret needed for
  // this flow since we never exchange an auth code).
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required for Google Sign-In'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Email (nodemailer)
  EMAIL_HOST: z.string().default('smtp.gmail.com'),
  EMAIL_PORT: z.coerce.number().default(587),
  EMAIL_USER: z.string().min(1, 'EMAIL_USER is required to send OTP emails'),
  EMAIL_PASS: z.string().min(1, 'EMAIL_PASS is required to send OTP emails'),
  EMAIL_FROM: z.string().default('"GymTracker AI" <noreply@gymtracker.ai>'),

  // Cloudinary (progress photos / avatars — wired for future use)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Grok (xAI) — the AI Coach's model. Called server-side only; the key
  // never reaches the browser (unlike the old Supabase-era frontend, which
  // called Grok directly from the client with an exposed key).
  GROK_API_KEY: z.string().min(1, 'GROK_API_KEY is required for the AI Coach'),
  GROK_API_URL: z.string().default('https://api.x.ai/v1/chat/completions'),
  GROK_MODEL: z.string().default('grok-4-latest'),

  // OTP behavior
  OTP_TTL_SECONDS: z.coerce.number().default(300), // 5 minutes
  OTP_MAX_SEND_PER_HOUR: z.coerce.number().default(5),
  OTP_MAX_VERIFY_ATTEMPTS: z.coerce.number().default(5),

  // Progress photo upload cap. Defaults generous (no realistic phone photo
  // gets anywhere near this) rather than restrictive — the app has very
  // few users right now, so there's no storage-cost reason to be strict.
  // Still bounded (not literally unlimited) purely so a malformed/huge
  // request body can't take the server down; raise via env if ever needed.
  PHOTO_UPLOAD_MAX_MB: z.coerce.number().positive().default(50),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:\n', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
export const isProduction = env.NODE_ENV === 'production'

// Sanity check: GROK_API_KEY is pointed at GROK_API_URL, but API keys from
// different providers are not interchangeable even though this app calls
// them all "Grok". A key starting with "gsk_" is a Groq (groq.com) key —
// a different company/API from xAI's Grok (api.x.ai), despite the similar
// name. Mixing them up is a common source of "the key is definitely set
// but every request still fails" bugs, so warn loudly at boot rather than
// only surfacing a cryptic 401 from the AI Coach later.
if (env.GROK_API_KEY.startsWith('gsk_') && env.GROK_API_URL.includes('x.ai')) {
  // eslint-disable-next-line no-console
  console.warn(
    '⚠️  GROK_API_KEY looks like a Groq (groq.com) key (starts with "gsk_"), but ' +
      'GROK_API_URL points at xAI (api.x.ai). These are different providers with ' +
      'incompatible keys — the AI Coach will fail with an auth error until this is fixed.\n' +
      '   Fix option A (use xAI\'s real Grok): get a key from https://console.x.ai and set it as GROK_API_KEY.\n' +
      '   Fix option B (use Groq instead): set GROK_API_URL=https://api.groq.com/openai/v1/chat/completions ' +
      'and GROK_MODEL to a Groq model name (e.g. "llama-3.3-70b-versatile").'
  )
}
