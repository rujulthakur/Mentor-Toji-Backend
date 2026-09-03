import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { validate } from '../../middlewares/validate.js'
import { settingsController } from './settings.controller.js'
import { updateSettingsSchema } from './settings.validators.js'

export const settingsRouter = Router()

settingsRouter.use(authenticate)

settingsRouter.get('/', settingsController.get)
settingsRouter.put('/', validate({ body: updateSettingsSchema }), settingsController.update)
