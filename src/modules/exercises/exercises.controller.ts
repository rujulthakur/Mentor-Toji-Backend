import type { Request, Response } from 'express'
import { sendResponse } from '../../utils/ApiResponse.js'
import { exercisesService } from './exercises.service.js'
import type { ListExercisesQuery } from './exercises.validators.js'

export const exercisesController = {
  async list(req: Request, res: Response) {
    const query = req.query as unknown as ListExercisesQuery
    const result = await exercisesService.list(query)
    sendResponse(res, {
      data: result.items,
      meta: { total: result.total, page: result.page, limit: result.limit },
    })
  },

  async getById(req: Request, res: Response) {
    const exercise = await exercisesService.getById(req.params.id as string)
    sendResponse(res, { data: exercise })
  },
}
