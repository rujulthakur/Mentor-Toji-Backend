import type { Request, Response } from 'express'
import { sendResponse } from '../../utils/ApiResponse.js'
import { AuthenticationError } from '../../utils/ApiError.js'
import { aiService } from './ai.service.js'
import type { SendMessageInput, ListConversationsQuery } from '../chat/chat.validators.js'

function requireUserId(req: Request<any, any, any, any, any>): string {
  if (!req.user) throw new AuthenticationError()
  return req.user.sub
}

export const aiController = {
  async sendMessage(req: Request<unknown, unknown, SendMessageInput>, res: Response) {
    const result = await aiService.sendMessage(requireUserId(req), req.body)
    sendResponse(res, { message: 'Reply generated', data: result })
  },

  async listConversations(req: Request, res: Response) {
    const query = req.query as unknown as ListConversationsQuery
    const result = await aiService.listConversations(requireUserId(req), query)
    sendResponse(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } })
  },

  async getConversation(req: Request, res: Response) {
    const conversation = await aiService.getConversation(requireUserId(req), req.params.id as string)
    sendResponse(res, { data: conversation })
  },

  async pin(req: Request, res: Response) {
    const conversation = await aiService.setPinned(requireUserId(req), req.params.id as string, true)
    sendResponse(res, { data: conversation })
  },

  async unpin(req: Request, res: Response) {
    const conversation = await aiService.setPinned(requireUserId(req), req.params.id as string, false)
    sendResponse(res, { data: conversation })
  },

  async remove(req: Request, res: Response) {
    await aiService.deleteConversation(requireUserId(req), req.params.id as string)
    sendResponse(res, { message: 'Conversation deleted' })
  },
}
