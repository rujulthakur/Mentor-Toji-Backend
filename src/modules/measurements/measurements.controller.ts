import type { Request, Response } from 'express'
import { sendResponse } from '../../utils/ApiResponse.js'
import { AuthenticationError } from '../../utils/ApiError.js'
import { measurementsService } from './measurements.service.js'
import type { CreateMeasurementInput, UpdateMeasurementInput, ListMeasurementsQuery } from './measurements.validators.js'

function requireUserId(req: Request<any, any, any, any, any>): string {
  if (!req.user) throw new AuthenticationError()
  return req.user.sub
}

export const measurementsController = {
  async create(req: Request<unknown, unknown, CreateMeasurementInput>, res: Response) {
    const m = await measurementsService.create(requireUserId(req), req.body)
    sendResponse(res, { statusCode: 201, message: 'Measurement saved', data: m })
  },

  async list(req: Request, res: Response) {
    const result = await measurementsService.list(requireUserId(req), req.query as unknown as ListMeasurementsQuery)
    sendResponse(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } })
  },

  async latest(req: Request, res: Response) {
    const m = await measurementsService.latest(requireUserId(req))
    sendResponse(res, { data: m })
  },

  async update(req: Request<{ id: string }, unknown, UpdateMeasurementInput>, res: Response) {
    const m = await measurementsService.update(requireUserId(req), req.params.id, req.body)
    sendResponse(res, { message: 'Measurement updated', data: m })
  },

  async remove(req: Request, res: Response) {
    await measurementsService.delete(requireUserId(req), req.params.id as string)
    sendResponse(res, { message: 'Measurement deleted' })
  },
}
