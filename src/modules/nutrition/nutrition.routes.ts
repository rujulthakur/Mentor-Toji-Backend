import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { validate } from '../../middlewares/validate.js'
import { nutritionController } from './nutrition.controller.js'
import {
  logMealSchema,
  editMealSchema,
  dateQuerySchema,
  rangeQuerySchema,
  mealIdParamSchema,
} from './nutrition.validators.js'

export const nutritionRouter = Router()

nutritionRouter.use(authenticate)

nutritionRouter.get('/goals', nutritionController.getGoals)
nutritionRouter.get('/day', validate({ query: dateQuerySchema }), nutritionController.getDay)
nutritionRouter.get('/logs', validate({ query: rangeQuerySchema }), nutritionController.listLogs)
nutritionRouter.get('/analytics/weekly', nutritionController.weeklyAnalytics)
nutritionRouter.get('/analytics/monthly', nutritionController.monthlyAnalytics)

nutritionRouter.post('/meals', validate({ body: logMealSchema }), nutritionController.addMeal)
nutritionRouter.put(
  '/meals/:mealId',
  validate({ params: mealIdParamSchema, query: dateQuerySchema, body: editMealSchema }),
  nutritionController.editMeal
)
nutritionRouter.delete('/meals/:mealId', validate({ params: mealIdParamSchema, query: dateQuerySchema }), nutritionController.deleteMeal)
nutritionRouter.post(
  '/meals/:mealId/duplicate',
  validate({ params: mealIdParamSchema, query: dateQuerySchema }),
  nutritionController.duplicateMeal
)
