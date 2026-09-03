import type { NextFunction, Request, Response } from 'express'
import type { Role } from '../constants/index.js'
import { AuthorizationError, AuthenticationError } from '../utils/ApiError.js'

/**
 * Use after `authenticate`. Example: `router.delete('/:id', authenticate, authorize('admin'), ...)`
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AuthenticationError('Not authenticated')
    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthorizationError()
    }
    next()
  }
}
