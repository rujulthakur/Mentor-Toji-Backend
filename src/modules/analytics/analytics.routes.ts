import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { analyticsController } from './analytics.controller.js'

export const analyticsRouter = Router()

analyticsRouter.use(authenticate)

analyticsRouter.get('/dashboard', analyticsController.dashboard)
analyticsRouter.get('/volume-trend', analyticsController.volumeTrend)
analyticsRouter.get('/muscle-distribution', analyticsController.muscleDistribution)
analyticsRouter.get('/weight-trend', analyticsController.weightTrend)
