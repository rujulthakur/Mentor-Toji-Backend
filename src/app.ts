import 'express-async-errors' // must be imported before routes so thrown errors in async handlers are caught automatically
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import morgan from 'morgan'
import mongoSanitize from 'express-mongo-sanitize'

import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { globalRateLimiter } from './middlewares/rateLimiter.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { notFound } from './middlewares/notFound.js'

import { authRouter } from './modules/auth/auth.routes.js'
import { usersRouter } from './modules/users/users.routes.js'
import { workoutsRouter } from './modules/workouts/workouts.routes.js'
import { plannerRouter } from './modules/planner/planner.routes.js'
import { exercisesRouter } from './modules/exercises/exercises.routes.js'
import { measurementsRouter } from './modules/measurements/measurements.routes.js'
import { progressRouter } from './modules/progress/progress.routes.js'
import { photosRouter } from './modules/photos/photos.routes.js'
import { analyticsRouter } from './modules/analytics/analytics.routes.js'
import { chatRouter } from './modules/chat/chat.routes.js'
import { aiRouter } from './modules/ai/ai.routes.js'
import { nutritionRouter } from './modules/nutrition/nutrition.routes.js'
import { settingsRouter } from './modules/settings/settings.routes.js'
import { notificationsRouter } from './modules/notifications/notifications.routes.js'
import { friendsRouter } from './modules/friends/friends.routes.js'

export const app = express()

// --- Security & parsing ---
app.set('trust proxy', 1) // needed for correct req.ip / secure cookies behind a load balancer (Render, Railway, etc.)
// Express auto-generates a weak ETag on every JSON response by default. For a
// stateful authenticated API that's actively harmful, not just wasted work:
// a browser can conditionally-revalidate a repeat GET (e.g. our own silent
// session-refresh check) and get back a bodyless `304 Not Modified` instead
// of a real `200`/`401`, which breaks any client logic that branches on the
// actual response. API responses should never be cached this way.
app.set('etag', false)
app.use(helmet())
app.use(
   cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (env.CLIENT_ORIGINS.includes(origin)) return callback(null, true)
      callback(new Error(`CORS blocked for origin: ${origin}`))
    },
    credentials: true, // required for the httpOnly auth cookies to be sent/received
  })
)
app.use(cookieParser())
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(compression())
app.use(mongoSanitize()) // strips '$' / '.' keys from req.body/query/params to prevent Mongo operator injection

// --- Logging ---
app.use(
  morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: { write: (msg: string) => logger.info(msg.trim()) },
  })
)

// --- Rate limiting (global; OTP endpoints layer their own Redis-backed limiter) ---
app.use(globalRateLimiter)

// --- Health check ---
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime() }))

// --- Routes ---
const api = express.Router()
api.use('/auth', authRouter)
api.use('/users', usersRouter)
api.use('/workouts', workoutsRouter)
api.use('/planner', plannerRouter)
api.use('/exercises', exercisesRouter)
api.use('/measurements', measurementsRouter)
api.use('/progress', progressRouter)
api.use('/photos', photosRouter)
api.use('/analytics', analyticsRouter)
api.use('/chat', chatRouter)
api.use('/ai', aiRouter)
api.use('/nutrition', nutritionRouter)
api.use('/settings', settingsRouter)
api.use('/notifications', notificationsRouter)
api.use('/friends', friendsRouter)

app.use(env.API_PREFIX, api)

app.use(notFound)
app.use(errorHandler)
