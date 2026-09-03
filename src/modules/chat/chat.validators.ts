import { z } from 'zod'

export const sendMessageSchema = z.object({
  conversationId: z.string().optional(), // omit to start a new conversation
  message: z.string().trim().min(1).max(4000),
})

export const conversationIdParamSchema = z.object({ id: z.string().min(1) })

export const listConversationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type ListConversationsQuery = z.infer<typeof listConversationsQuerySchema>
