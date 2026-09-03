export class ApiError extends Error {
  statusCode: number
  isOperational: boolean
  details?: unknown

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.isOperational = true
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(400, message, details)
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed') {
    super(401, message)
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'You do not have permission to perform this action') {
    super(403, message)
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message)
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super(409, message)
  }
}

export class RateLimitError extends ApiError {
  constructor(message = 'Too many requests, please try again later') {
    super(429, message)
  }
}

export class DatabaseError extends ApiError {
  constructor(message = 'Database operation failed') {
    super(500, message)
  }
}

export class AIError extends ApiError {
  constructor(message = 'AI service failed to respond') {
    super(502, message)
  }
}

export class CloudinaryError extends ApiError {
  constructor(message = 'File upload failed') {
    super(502, message)
  }
}
