import type { Request, Response } from 'express'
import { sendResponse } from '../../utils/ApiResponse.js'
import { usersService } from './users.service.js'
import type { UpdateProfileInput } from './users.validators.js'
import { AuthenticationError } from '../../utils/ApiError.js'

function requireUserId(req: Request<any, any, any, any, any>): string {
  if (!req.user) throw new AuthenticationError()
  return req.user.sub
}

export const usersController = {
  async getMe(req: Request, res: Response) {
    const profile = await usersService.getMe(requireUserId(req))
    sendResponse(res, { data: profile })
  },

  async updateMe(req: Request<unknown, unknown, UpdateProfileInput>, res: Response) {
    const profile = await usersService.updateMe(requireUserId(req), req.body)
    sendResponse(res, { message: 'Profile updated', data: profile })
  },

  async deleteMe(req: Request, res: Response) {
    await usersService.deleteMe(requireUserId(req))
    sendResponse(res, { message: 'Account deleted' })
  },
}
