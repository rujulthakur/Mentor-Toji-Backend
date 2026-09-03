import type { NextFunction, Request, Response } from 'express'
import type { ZodSchema } from 'zod'

interface Schemas {
  body?: ZodSchema
  query?: ZodSchema
  params?: ZodSchema
}

/**
 * Validates body/query/params against Zod schemas before the request ever
 * reaches a controller. Never trust the frontend's validation — this is
 * the real gate. Throws ZodError on failure, caught by the global error
 * handler (which formats it into the standard error envelope).
 */
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.body) req.body = schemas.body.parse(req.body)
    if (schemas.query) req.query = schemas.query.parse(req.query)
    if (schemas.params) req.params = schemas.params.parse(req.params)
    next()
  }
}
