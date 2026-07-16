// Typed error carrying an HTTP status, thrown from services and mapped by the error middleware.
export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (msg, details) => new ApiError(400, msg, details);
export const notFound = (msg = 'Not found') => new ApiError(404, msg);
