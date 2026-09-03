import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { validate } from '../../middlewares/validate.js'
import { usersController } from './users.controller.js'
import { updateProfileSchema } from './users.validators.js'

export const usersRouter = Router()

usersRouter.use(authenticate)

usersRouter.get('/me', usersController.getMe)
usersRouter.put('/me', validate({ body: updateProfileSchema }), usersController.updateMe)
usersRouter.delete('/me', usersController.deleteMe)
