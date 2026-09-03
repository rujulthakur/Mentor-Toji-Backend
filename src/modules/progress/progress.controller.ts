import type { Request, Response } from 'express'
import { sendResponse } from '../../utils/ApiResponse.js'
import { AuthenticationError } from '../../utils/ApiError.js'
import { progressService } from './progress.service.js'

function requireUserId(req: Request<any, any, any, any, any>): string {
  if (!req.user) throw new AuthenticationError()
  return req.user.sub
}

export const progressController = {
  async overview(req: Request, res: Response) {
    const data = await progressService.overview(requireUserId(req))
    sendResponse(res, { data })
  },
}
