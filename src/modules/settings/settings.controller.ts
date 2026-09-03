import type { Request, Response } from 'express'
import { sendResponse } from '../../utils/ApiResponse.js'
import { AuthenticationError } from '../../utils/ApiError.js'
import { settingsService } from './settings.service.js'
import type { UpdateSettingsInput } from './settings.validators.js'

function requireUserId(req: Request<any, any, any, any, any>): string {
  if (!req.user) throw new AuthenticationError()
  return req.user.sub
}

export const settingsController = {
  async get(req: Request, res: Response) {
    const settings = await settingsService.get(requireUserId(req))
    sendResponse(res, { data: settings })
  },

  async update(req: Request<unknown, unknown, UpdateSettingsInput>, res: Response) {
    const settings = await settingsService.update(requireUserId(req), req.body)
    sendResponse(res, { message: 'Settings updated', data: settings })
  },
}
