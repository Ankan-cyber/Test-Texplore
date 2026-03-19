export class ServiceError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
    this.details = details;
  }
}
