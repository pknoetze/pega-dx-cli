export interface NormalizedError {
  code: string;
  message: string;
  httpStatus: number;
  pegaErrorId?: string;
}

interface PegaErrorBody {
  localizedValue?: string;
  errorDetails?: unknown;
  errors?: Array<{ ID?: string; message?: string }>;
  message?: string;
}

const STATUS_TO_CODE: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  408: 'TIMEOUT',
  409: 'CONFLICT',
  412: 'PRECONDITION_FAILED',
  422: 'VALIDATION_FAIL',
  423: 'LOCKED',
  424: 'FAILED_DEPENDENCY',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_SERVER_ERROR',
};

function mapStatus(status: number): string {
  if (STATUS_TO_CODE[status]) return STATUS_TO_CODE[status];
  if (status >= 500 && status < 600) return 'SERVER_ERROR';
  return 'HTTP_ERROR';
}

function resolveMessage(body: PegaErrorBody, response: Response): string {
  if (body.localizedValue) return body.localizedValue;
  if (body.errors?.[0]?.message) return body.errors[0].message;
  if (body.message) return body.message;
  return response.statusText || `HTTP ${response.status}`;
}

export function fromHttpResponse(response: Response, body: unknown): NormalizedError {
  const pegaBody = (body && typeof body === 'object' ? body : {}) as PegaErrorBody;
  const err: NormalizedError = {
    code: mapStatus(response.status),
    message: resolveMessage(pegaBody, response),
    httpStatus: response.status,
  };
  const pegaErrorId = pegaBody.errors?.[0]?.ID;
  if (pegaErrorId) err.pegaErrorId = pegaErrorId;
  return err;
}

export function fromNetworkError(err: Error): NormalizedError {
  if (err.name === 'AbortError') {
    return { code: 'TIMEOUT', message: err.message || 'Request timed out', httpStatus: 0 };
  }
  return { code: 'NETWORK_ERROR', message: err.message || 'Network error', httpStatus: 0 };
}

export function isNormalizedError(x: unknown): x is NormalizedError {
  if (!x || typeof x !== 'object') return false;
  const e = x as Partial<NormalizedError>;
  return typeof e.code === 'string' && typeof e.message === 'string' && typeof e.httpStatus === 'number';
}

export function exitCodeFor(err: NormalizedError): 1 | 2 {
  return err.code === 'INVALID_CONFIG' || err.code === 'INVALID_ARGS' ? 2 : 1;
}
