import type { Request, Response } from 'express'
import { sendResponse } from '../../utils/ApiResponse.js'
import { AuthenticationError } from '../../utils/ApiError.js'
import { workoutsService } from './workouts.service.js'
import type { CreateWorkoutInput, UpdateWorkoutInput, ListWorkoutsQuery } from './workouts.validators.js'

function requireUserId(req: Request<any, any, any, any, any>): string {
  if (!req.user) throw new AuthenticationError()
  return req.user.sub
}

export const workoutsController = {
  async create(req: Request<unknown, unknown, CreateWorkoutInput>, res: Response) {
    const { session, overload } = await workoutsService.create(requireUserId(req), req.body)
    sendResponse(res, { statusCode: 201, message: 'Workout saved', data: { session, overload } })
  },

  async list(req: Request, res: Response) {
    const result = await workoutsService.list(requireUserId(req), req.query as unknown as ListWorkoutsQuery)
    sendResponse(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } })
  },

  async getById(req: Request, res: Response) {
    const session = await workoutsService.getById(requireUserId(req), req.params.id as string)
    sendResponse(res, { data: session })
  },

  async update(req: Request<{ id: string }, unknown, UpdateWorkoutInput>, res: Response) {
    const { session, overload } = await workoutsService.update(requireUserId(req), req.params.id, req.body)
    sendResponse(res, { message: 'Workout updated', data: { session, overload } })
  },

  async remove(req: Request, res: Response) {
    await workoutsService.delete(requireUserId(req), req.params.id as string)
    sendResponse(res, { message: 'Workout deleted' })
  },

  async personalRecords(req: Request, res: Response) {
    const prs = await workoutsService.listPersonalRecords(requireUserId(req))
    sendResponse(res, { data: prs })
  },

  async streak(req: Request, res: Response) {
    const streak = await workoutsService.currentStreak(requireUserId(req))
    sendResponse(res, { data: { streak } })
  },
}
