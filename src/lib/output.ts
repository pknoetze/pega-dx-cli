import type { NormalizedError } from './errors.js';

export interface OutputOpts {
  format: 'json' | 'compact';
  fields?: string;
}

export interface DryRunRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
}

export function redactAuthHeader(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    out[k] = k.toLowerCase() === 'authorization' ? '[REDACTED]' : v;
  }
  return out;
}

function filterFields(data: unknown, fields: string): unknown {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
  const allowed = new Set(fields.split(',').map((f) => f.trim()).filter(Boolean));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (allowed.has(k)) out[k] = v;
  }
  return out;
}

function serialize(data: unknown, format: 'json' | 'compact'): string {
  return format === 'compact' ? JSON.stringify(data) : JSON.stringify(data, null, 2);
}

export function stdout(data: unknown, opts: OutputOpts): void {
  const filtered = opts.fields ? filterFields(data, opts.fields) : data;
  process.stdout.write(serialize(filtered, opts.format) + '\n');
}

export function stderr(message: string, opts: { quiet: boolean }): void {
  if (opts.quiet) return;
  process.stderr.write(message + '\n');
}

export function error(err: NormalizedError): void {
  const payload: Record<string, unknown> = {
    error: true,
    code: err.code,
    message: err.message,
    httpStatus: err.httpStatus,
  };
  if (err.pegaErrorId) payload.pegaErrorId = err.pegaErrorId;
  process.stderr.write(JSON.stringify(payload, null, 2) + '\n');
}

export function dryRun(req: DryRunRequest): void {
  const redactedHeaders = redactAuthHeader(req.headers);
  const payload = {
    method: req.method,
    url: req.url,
    headers: redactedHeaders,
    ...(req.body !== undefined ? { body: req.body } : {}),
  };
  process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
}
