import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { validate } from '../../middlewares/validate.js'
import { measurementsController } from './measurements.controller.js'
import {
  createMeasurementSchema,
  updateMeasurementSchema,
  listMeasurementsQuerySchema,
  measurementIdParamSchema,
} from './measurements.validators.js'

export const measurementsRouter = Router()

measurementsRouter.use(authenticate)

measurementsRouter.get('/latest', measurementsController.latest)
measurementsRouter.get('/', validate({ query: listMeasurementsQuerySchema }), measurementsController.list)
measurementsRouter.post('/', validate({ body: createMeasurementSchema }), measurementsController.create)
measurementsRouter.put('/:id', validate({ params: measurementIdParamSchema, body: updateMeasurementSchema }), measurementsController.update)
measurementsRouter.delete('/:id', validate({ params: measurementIdParamSchema }), measurementsController.remove)
