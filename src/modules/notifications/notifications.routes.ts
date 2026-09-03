import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { notificationsController } from './notifications.controller.js'

export const notificationsRouter = Router()

notificationsRouter.use(authenticate)

notificationsRouter.get('/', notificationsController.list)
notificationsRouter.post('/read-all', notificationsController.markAllRead)
notificationsRouter.post('/:id/read', notificationsController.markRead)
notificationsRouter.delete('/:id', notificationsController.remove)
