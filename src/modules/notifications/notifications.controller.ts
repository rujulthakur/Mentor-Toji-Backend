import type { Request, Response } from 'express'
import { sendResponse } from '../../utils/ApiResponse.js'
import { AuthenticationError } from '../../utils/ApiError.js'
import { notificationsService } from './notifications.service.js'

function requireUserId(req: Request<any, any, any, any, any>): string {
  if (!req.user) throw new AuthenticationError()
  return req.user.sub
}

export const notificationsController = {
  async list(req: Request, res: Response) {
    const page = req.query.page ? Number(req.query.page) : 1
    const limit = req.query.limit ? Number(req.query.limit) : 20
    const result = await notificationsService.list(requireUserId(req), page, limit)
    sendResponse(res, {
      data: result.items,
      meta: { total: result.total, page: result.page, limit: result.limit, unreadCount: result.unreadCount },
    })
  },

  async markRead(req: Request, res: Response) {
    const n = await notificationsService.markRead(requireUserId(req), req.params.id as string)
    sendResponse(res, { data: n })
  },

  async markAllRead(req: Request, res: Response) {
    await notificationsService.markAllRead(requireUserId(req))
    sendResponse(res, { message: 'All notifications marked read' })
  },

  async remove(req: Request, res: Response) {
    await notificationsService.remove(requireUserId(req), req.params.id as string)
    sendResponse(res, { message: 'Notification deleted' })
  },
}
