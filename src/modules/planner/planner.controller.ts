import type { Request, Response } from 'express'
import { sendResponse } from '../../utils/ApiResponse.js'
import { AuthenticationError } from '../../utils/ApiError.js'
import { plannerService } from './planner.service.js'
import type { Weekday } from './planner.types.js'
import type { UpdateDayInput } from './planner.validators.js'

function requireUserId(req: Request<any, any, any, any, any>): string {
  if (!req.user) throw new AuthenticationError()
  return req.user.sub
}

export const plannerController = {
  async get(req: Request, res: Response) {
    const planner = await plannerService.get(requireUserId(req))
    sendResponse(res, { data: planner })
  },

  async updateDay(req: Request<{ day: Weekday }, unknown, UpdateDayInput>, res: Response) {
    const planner = await plannerService.updateDay(requireUserId(req), req.params.day, req.body)
    sendResponse(res, { message: 'Workout planner updated', data: planner })
  },
}
