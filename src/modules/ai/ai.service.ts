import { NotFoundError } from '../../utils/ApiError.js'
import { chatRepository } from '../chat/chat.repository.js'
import { buildUserContext } from './contextBuilder.js'
import { buildMessages } from './promptBuilder.js'
import { callGrok, type GrokMessage } from './grokClient.js'
import { ChatConversation } from '../../models/ChatConversation.model.js'

export const aiService = {
  /**
   * Sends one user message to the AI Coach. If `conversationId` is
   * omitted, starts a new conversation. Always rebuilds the full user
   * context from the database first (profile, workouts, measurements,
   * PRs) — the AI never has to be told who the user is; the backend
   * carries that memory on every call, per the spec.
   */
  async sendMessage(userId: string, input: { conversationId?: string; message: string }) {
    let conversation = input.conversationId
      ? await chatRepository.findById(userId, input.conversationId)
      : null

    if (input.conversationId && !conversation) throw new NotFoundError('Conversation not found')

    if (!conversation) {
      const title = input.message.length > 60 ? `${input.message.slice(0, 57)}...` : input.message
      conversation = await chatRepository.create(userId, title)
    }

    const context = await buildUserContext(userId)

    // Prior turns become conversation history for Grok (kept short — the
    // fresh context block above is the durable memory, not raw replay).
    const history: GrokMessage[] = conversation.messages.slice(-16).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const messages = buildMessages(context, history, input.message)
    const result = await callGrok(messages)

    const now = new Date()
    await chatRepository.appendMessages(String(conversation._id), [
      { role: 'user', content: input.message, createdAt: now, contextSnapshot: context },
      { role: 'assistant', content: result.content, createdAt: new Date(), tokenUsage: result.tokenUsage },
    ])

    const updated = await ChatConversation.findById(conversation._id).lean()

    return {
      conversationId: String(conversation._id),
      reply: result.content,
      conversation: updated,
    }
  },

  async listConversations(userId: string, query: { page: number; limit: number }) {
    return chatRepository.find(userId, query)
  },

  async getConversation(userId: string, id: string) {
    const conversation = await chatRepository.findById(userId, id)
    if (!conversation) throw new NotFoundError('Conversation not found')
    return conversation
  },

  async setPinned(userId: string, id: string, pinned: boolean) {
    const conversation = await chatRepository.setPinned(userId, id, pinned)
    if (!conversation) throw new NotFoundError('Conversation not found')
    return conversation
  },

  async deleteConversation(userId: string, id: string) {
    await chatRepository.softDelete(userId, id)
  },
}
