import mongoose from 'mongoose'
import { env } from './env.js'
import { logger } from './logger.js'

mongoose.set('strictQuery', true)

export async function connectDB(): Promise<void> {
  mongoose.connection.on('connected', () => logger.info('✅ MongoDB Atlas connected'))
  mongoose.connection.on('error', (err) => logger.error('MongoDB connection error', err))
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'))

  await mongoose.connect(env.MONGODB_URI, {
    // Sensible defaults for a production Atlas cluster. Pool size can be
    // tuned per instance size; 10 is a safe starting point for a single
    // API server behind a load balancer.
    maxPoolSize: 10,
  })
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect()
}
