import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { validate } from '../../middlewares/validate.js'
import { aiController } from './ai.controller.js'
import { sendMessageSchema, listConversationsQuerySchema, conversationIdParamSchema } from '../chat/chat.validators.js'

export const aiRouter = Router()

aiRouter.use(authenticate)

// The AI Coach chat surface. Conversation storage/retrieval is exposed
// here directly (rather than duplicated under /chat) since the frontend's
// AiCoach page is the only consumer of conversation history.
aiRouter.post('/message', validate({ body: sendMessageSchema }), aiController.sendMessage)
aiRouter.get('/conversations', validate({ query: listConversationsQuerySchema }), aiController.listConversations)
aiRouter.get('/conversations/:id', validate({ params: conversationIdParamSchema }), aiController.getConversation)
aiRouter.post('/conversations/:id/pin', validate({ params: conversationIdParamSchema }), aiController.pin)
aiRouter.post('/conversations/:id/unpin', validate({ params: conversationIdParamSchema }), aiController.unpin)
aiRouter.delete('/conversations/:id', validate({ params: conversationIdParamSchema }), aiController.remove)
