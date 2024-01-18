export function throwBadRequest(): never {
  throw new HttpError(400, 'Bad Request');
}

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any,
  ) {
    super(message);
    Error.captureStackTrace(this);
    this.name = 'HttpError';
  }
}
