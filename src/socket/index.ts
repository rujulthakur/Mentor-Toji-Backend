import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

/**
 * Not used by any feature yet. Wired up now so live-workout-session
 * features (spec: "prepare architecture for future live features") can be
 * added without touching the server bootstrap — just add a namespace/
 * handler file here and import it below.
 */
export function initSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
      cors: { origin: env.CLIENT_ORIGINS, credentials: true },
  })

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`)
    socket.on('disconnect', () => logger.debug(`Socket disconnected: ${socket.id}`))
  })

  return io
}
