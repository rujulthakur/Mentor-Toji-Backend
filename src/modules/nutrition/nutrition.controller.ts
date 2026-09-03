import type { Request, Response } from 'express'
import { sendResponse } from '../../utils/ApiResponse.js'
import { AuthenticationError } from '../../utils/ApiError.js'
import { nutritionService } from './nutrition.service.js'
import type { LogMealInput, EditMealInput, DateQuery, RangeQuery } from './nutrition.validators.js'

function requireUserId(req: Request<any, any, any, any, any>): string {
  if (!req.user) throw new AuthenticationError()
  return req.user.sub
}

export const nutritionController = {
  async getDay(req: Request, res: Response) {
    const { date } = req.query as unknown as DateQuery
    const day = await nutritionService.getDay(requireUserId(req), date)
    sendResponse(res, { data: day })
  },

  async getGoals(req: Request, res: Response) {
    const goals = await nutritionService.getGoals(requireUserId(req))
    sendResponse(res, { data: goals })
  },

  async addMeal(req: Request<unknown, unknown, LogMealInput>, res: Response) {
    const result = await nutritionService.addMeal(requireUserId(req), req.body)
    sendResponse(res, { statusCode: 201, message: 'Meal logged', data: result })
  },

  async editMeal(req: Request<{ mealId: string }, unknown, EditMealInput>, res: Response) {
    const date = (req.query as unknown as DateQuery).date
    const log = await nutritionService.editMeal(requireUserId(req), date, req.params.mealId, req.body)
    sendResponse(res, { message: 'Meal updated', data: log })
  },

  async deleteMeal(req: Request<{ mealId: string }>, res: Response) {
    const date = (req.query as unknown as DateQuery).date
    const log = await nutritionService.deleteMeal(requireUserId(req), date, req.params.mealId)
    sendResponse(res, { message: 'Meal deleted', data: log })
  },

  async duplicateMeal(req: Request<{ mealId: string }>, res: Response) {
    const date = (req.query as unknown as DateQuery).date
    const log = await nutritionService.duplicateMeal(requireUserId(req), date, req.params.mealId)
    sendResponse(res, { statusCode: 201, message: 'Meal duplicated', data: log })
  },

  async listLogs(req: Request, res: Response) {
    const query = req.query as unknown as RangeQuery
    const result = await nutritionService.listLogs(requireUserId(req), query)
    sendResponse(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } })
  },

  async weeklyAnalytics(req: Request, res: Response) {
    const data = await nutritionService.weeklyAnalytics(requireUserId(req))
    sendResponse(res, { data })
  },

  async monthlyAnalytics(req: Request, res: Response) {
    const data = await nutritionService.monthlyAnalytics(requireUserId(req))
    sendResponse(res, { data })
  },
}
