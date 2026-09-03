import { Router } from 'express'

/**
 * Conversation storage lives here (chat.repository.ts / ChatConversation
 * model), but is consumed entirely through the `ai` module's routes
 * (POST /ai/message, GET /ai/conversations, ...) since the AI Coach page
 * is the only feature that reads/writes chat data. No routes are mounted
 * directly here to avoid two URLs for the same resource.
 */
export const chatRouter = Router()
