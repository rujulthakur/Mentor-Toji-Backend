import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { progressController } from './progress.controller.js'

export const progressRouter = Router()

progressRouter.use(authenticate)

progressRouter.get('/', progressController.overview)
