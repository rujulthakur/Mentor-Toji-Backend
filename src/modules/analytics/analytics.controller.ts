import type { Request, Response } from 'express'
import { sendResponse } from '../../utils/ApiResponse.js'
import { AuthenticationError } from '../../utils/ApiError.js'
import { analyticsService } from './analytics.service.js'

function requireUserId(req: Request<any, any, any, any, any>): string {
  if (!req.user) throw new AuthenticationError()
  return req.user.sub
}

export const analyticsController = {
  async dashboard(req: Request, res: Response) {
    const data = await analyticsService.dashboard(requireUserId(req))
    sendResponse(res, { data })
  },

  async volumeTrend(req: Request, res: Response) {
    const weeks = req.query.weeks ? Number(req.query.weeks) : undefined
    const data = await analyticsService.volumeTrend(requireUserId(req), weeks)
    sendResponse(res, { data })
  },

  async muscleDistribution(req: Request, res: Response) {
    const days = req.query.days ? Number(req.query.days) : undefined
    const data = await analyticsService.muscleDistribution(requireUserId(req), days)
    sendResponse(res, { data })
  },

  async weightTrend(req: Request, res: Response) {
    const months = req.query.months ? Number(req.query.months) : undefined
    const data = await analyticsService.weightTrend(requireUserId(req), months)
    sendResponse(res, { data })
  },
}
