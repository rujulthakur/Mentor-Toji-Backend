import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { validate } from '../../middlewares/validate.js'
import { workoutsController } from './workouts.controller.js'
import {
  createWorkoutSchema,
  updateWorkoutSchema,
  listWorkoutsQuerySchema,
  workoutIdParamSchema,
} from './workouts.validators.js'

export const workoutsRouter = Router()

workoutsRouter.use(authenticate)

// Static/collection sub-routes before the ':id' param route so they never get swallowed by it.
workoutsRouter.get('/personal-records', workoutsController.personalRecords)
workoutsRouter.get('/streak', workoutsController.streak)

workoutsRouter.get('/', validate({ query: listWorkoutsQuerySchema }), workoutsController.list)
workoutsRouter.post('/', validate({ body: createWorkoutSchema }), workoutsController.create)
workoutsRouter.get('/:id', validate({ params: workoutIdParamSchema }), workoutsController.getById)
workoutsRouter.put('/:id', validate({ params: workoutIdParamSchema, body: updateWorkoutSchema }), workoutsController.update)
workoutsRouter.delete('/:id', validate({ params: workoutIdParamSchema }), workoutsController.remove)
