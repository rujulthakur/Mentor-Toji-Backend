import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { validate } from '../../middlewares/validate.js'
import { plannerController } from './planner.controller.js'
import { updateDaySchema, weekdayParamSchema } from './planner.validators.js'

export const plannerRouter = Router()

plannerRouter.use(authenticate)

plannerRouter.get('/', plannerController.get)
plannerRouter.put('/:day', validate({ params: weekdayParamSchema, body: updateDaySchema }), plannerController.updateDay)
