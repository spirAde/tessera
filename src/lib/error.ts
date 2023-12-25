export class HttpError extends Error {
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

export class HttpNoContentError extends HttpError {
  constructor(public status: number) {
    super(status, '');
    Error.captureStackTrace(this);
    this.name = 'HttpNoContentError';
  }
}

export function buildValidationError({
  message,
  fields,
}: {
  message?: string;
  fields?: Array<{ name: string; message: string }>;
}) {
  let rootMessage = '';
  if (message) {
    rootMessage = message;
  } else if (fields) {
    const messages = fields.map((field) => `'${field.name}' ${field.message}`);
    rootMessage = `Validation errors: ${messages.join(', ')}`;
  }
  const data = fields ? { fields } : null;
  return new HttpError(422, rootMessage, data);
}

export function throwBadRequest(): never {
  throw new HttpError(400, 'Bad Request');
}

export function throwUnauthorized(): never {
  throw new HttpError(401, 'Unauthorized');
}

export function throwForbidden(): never {
  throw new HttpError(403, 'Forbidden');
}

export function throwNotFound(msg?: string): never {
  throw new HttpError(404, msg || 'Not found');
}

export function throwInternalServerError(): never {
  throw new HttpError(500, 'Internal Server Error');
}
