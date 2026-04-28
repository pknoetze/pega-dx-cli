import { fromHttpResponse, fromNetworkError } from './errors.js';
import { redactAuthHeader } from './output.js';

export interface RequestOpts {
  timeoutMs?: number;
  extraHeaders?: Record<string, string>;
}

export interface LoggedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

export interface LoggedResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

export interface ResponseWithMeta<T> {
  data: T;
  eTag?: string;
  status: number;
}

export interface PegaApiClient {
  get<T>(path: string, opts?: RequestOpts): Promise<T>;
  post<T>(path: string, body: unknown, opts?: RequestOpts): Promise<T>;
  put<T>(path: string, body: unknown, opts?: RequestOpts): Promise<T>;
  patch<T>(path: string, body: unknown, opts?: RequestOpts): Promise<T>;
  delete<T>(path: string, opts?: RequestOpts): Promise<T>;
  getWithMeta<T>(path: string, opts?: RequestOpts): Promise<ResponseWithMeta<T>>;
}

export interface PegaApiClientDeps {
  baseUrl: string;
  tokenProvider: () => Promise<string>;
  onVerbose?: (req: LoggedRequest, res: LoggedResponse) => void;
}

const DEFAULT_TIMEOUT_MS = 15_000;
export const EXTENDED_TIMEOUT_MS = 45_000;

function v2Root(baseUrl: string): string {
  return `${baseUrl}/prweb/api/application/v2`;
}

function buildHeaders(
  token: string,
  extras: Record<string, string> = {},
  bodyPresent = false,
): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'x-origin-channel': 'Web',
  };
  if (bodyPresent) headers['Content-Type'] = 'application/json';
  for (const [k, v] of Object.entries(extras)) headers[k] = v;
  return headers;
}

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0' || response.status === 204) return {};
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    return text ? { message: text } : {};
  }
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function doRequest<T>(
  deps: PegaApiClientDeps,
  method: string,
  path: string,
  body: unknown,
  opts: RequestOpts = {},
): Promise<ResponseWithMeta<T>> {
  const token = await deps.tokenProvider();
  const url = `${v2Root(deps.baseUrl)}${path}`;
  const hasBody = body !== undefined && method !== 'GET' && method !== 'DELETE';
  const headers = buildHeaders(token, opts.extraHeaders, hasBody);
  const serialized = hasBody ? JSON.stringify(body) : undefined;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: serialized,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    throw fromNetworkError(err as Error);
  }
  clearTimeout(timeout);

  const parsed = await parseBody(response);
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((v, k) => {
    responseHeaders[k] = v;
  });

  deps.onVerbose?.(
    { method, url, headers: redactAuthHeader(headers), body: serialized },
    { status: response.status, headers: responseHeaders, body: parsed },
  );

  if (!response.ok) {
    throw fromHttpResponse(response, parsed);
  }

  const eTag = response.headers.get('etag') ?? undefined;
  return { data: parsed as T, eTag, status: response.status };
}

export function createPegaApiClient(deps: PegaApiClientDeps): PegaApiClient {
  return {
    async get<T>(path: string, opts?: RequestOpts): Promise<T> {
      const r = await doRequest<T>(deps, 'GET', path, undefined, opts);
      return r.data;
    },
    async post<T>(path: string, body: unknown, opts?: RequestOpts): Promise<T> {
      const r = await doRequest<T>(deps, 'POST', path, body, opts);
      return r.data;
    },
    async put<T>(path: string, body: unknown, opts?: RequestOpts): Promise<T> {
      const r = await doRequest<T>(deps, 'PUT', path, body, opts);
      return r.data;
    },
    async patch<T>(path: string, body: unknown, opts?: RequestOpts): Promise<T> {
      const r = await doRequest<T>(deps, 'PATCH', path, body, opts);
      return r.data;
    },
    async delete<T>(path: string, opts?: RequestOpts): Promise<T> {
      const r = await doRequest<T>(deps, 'DELETE', path, undefined, opts);
      return r.data;
    },
    async getWithMeta<T>(path: string, opts?: RequestOpts): Promise<ResponseWithMeta<T>> {
      return doRequest<T>(deps, 'GET', path, undefined, opts);
    },
  };
}
