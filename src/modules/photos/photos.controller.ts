import type { Request, Response } from 'express'
import { sendResponse } from '../../utils/ApiResponse.js'
import { AuthenticationError, ValidationError } from '../../utils/ApiError.js'
import { photosService } from './photos.service.js'
import type { UploadPhotoBody, ListPhotosQuery } from './photos.validators.js'

function requireUserId(req: Request<any, any, any, any, any>): string {
  if (!req.user) throw new AuthenticationError()
  return req.user.sub
}

export const photosController = {
  async upload(req: Request<unknown, unknown, UploadPhotoBody>, res: Response) {
    if (!req.file) throw new ValidationError('A photo file is required (field name "photo")')
    const photo = await photosService.upload(requireUserId(req), req.file, req.body)
    sendResponse(res, { statusCode: 201, message: 'Photo uploaded', data: photo })
  },

  async list(req: Request, res: Response) {
    const result = await photosService.list(requireUserId(req), req.query as unknown as ListPhotosQuery)
    sendResponse(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } })
  },

  async remove(req: Request, res: Response) {
    await photosService.delete(requireUserId(req), req.params.id as string)
    sendResponse(res, { message: 'Photo deleted' })
  },
}
