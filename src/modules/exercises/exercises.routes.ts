import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { validate } from '../../middlewares/validate.js'
import { exercisesController } from './exercises.controller.js'
import { listExercisesQuerySchema, exerciseIdParamSchema } from './exercises.validators.js'

export const exercisesRouter = Router()

exercisesRouter.use(authenticate)

exercisesRouter.get('/', validate({ query: listExercisesQuerySchema }), exercisesController.list)
exercisesRouter.get('/:id', validate({ params: exerciseIdParamSchema }), exercisesController.getById)
