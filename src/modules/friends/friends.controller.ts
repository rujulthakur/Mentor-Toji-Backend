import type { Request, Response } from 'express'
import type { ParamsDictionary } from 'express-serve-static-core'
import type { ParsedQs } from 'qs'
import { sendResponse } from '../../utils/ApiResponse.js'
import { AuthenticationError } from '../../utils/ApiError.js'
import { friendsService } from './friends.service.js'
import type { SearchUsersQuery, SendFriendRequestInput } from './friends.validators.js'

function requireUserId(req: Request<any, any, any, any, any>): string {
  if (!req.user) throw new AuthenticationError()
  return req.user.sub
}

export const friendsController = {
  async searchUsers(req: Request<ParamsDictionary, unknown, unknown, ParsedQs>, res: Response) {
    // `validate` middleware has already parsed req.query against searchUsersQuerySchema,
    // so the runtime shape matches SearchUsersQuery even though Express types req.query as ParsedQs.
    const { q, page, limit } = req.query as unknown as SearchUsersQuery
    const result = await friendsService.searchUsers(requireUserId(req), q, page, limit)
    sendResponse(res, { data: result })
  },

  async sendRequest(req: Request<unknown, unknown, SendFriendRequestInput>, res: Response) {
    const request = await friendsService.sendRequest(requireUserId(req), req.body.addresseeId)
    sendResponse(res, { statusCode: 201, message: 'Friend request sent', data: request })
  },

  async acceptRequest(req: Request<{ requestId: string }>, res: Response) {
    const request = await friendsService.acceptRequest(requireUserId(req), req.params.requestId)
    sendResponse(res, { message: 'Friend request accepted', data: request })
  },

  async rejectRequest(req: Request<{ requestId: string }>, res: Response) {
    const request = await friendsService.rejectRequest(requireUserId(req), req.params.requestId)
    sendResponse(res, { message: 'Friend request rejected', data: request })
  },

  async removeFriend(req: Request<{ userId: string }>, res: Response) {
    const result = await friendsService.removeFriend(requireUserId(req), req.params.userId)
    sendResponse(res, { message: 'Friend removed', data: result })
  },

  async listFriends(req: Request, res: Response) {
    const friends = await friendsService.listFriends(requireUserId(req))
    sendResponse(res, { data: friends })
  },

  async listIncoming(req: Request, res: Response) {
    const requests = await friendsService.listIncoming(requireUserId(req))
    sendResponse(res, { data: requests })
  },

  async listOutgoing(req: Request, res: Response) {
    const requests = await friendsService.listOutgoing(requireUserId(req))
    sendResponse(res, { data: requests })
  },

  async getOwnCommunityStats(req: Request, res: Response) {
    const stats = await friendsService.getOwnCommunityStats(requireUserId(req))
    sendResponse(res, { data: stats })
  },

  async getPublicProfile(req: Request<{ userId: string }>, res: Response) {
    const profile = await friendsService.getPublicProfile(requireUserId(req), req.params.userId)
    sendResponse(res, { data: profile })
  },
}
