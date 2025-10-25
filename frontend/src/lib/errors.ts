/**
 * Custom error class for API failures
 */
export class APIError extends Error {
  status?: number;
  endpoint: string;
  details?: any;

  constructor(
    message: string,
    endpoint: string,
    status?: number,
    details?: any
  ) {
    super(message);
    this.name = "APIError";
    this.endpoint = endpoint;
    this.status = status;
    this.details = details;
  }
}
