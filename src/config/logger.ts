/**
 * Deliberately lightweight. Swap the internals for winston/pino later
 * without touching any call site — everything in the app imports `logger`
 * from here, never `console` directly.
 */
function timestamp() {
  return new Date().toISOString()
}

export const logger = {
  info: (...args: unknown[]) => console.log(`[${timestamp()}] INFO`, ...args),
  warn: (...args: unknown[]) => console.warn(`[${timestamp()}] WARN`, ...args),
  error: (...args: unknown[]) => console.error(`[${timestamp()}] ERROR`, ...args),
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') console.debug(`[${timestamp()}] DEBUG`, ...args)
  },
}
