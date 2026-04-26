import * as yaml from 'js-yaml';
import Table from 'cli-table3';
import type { NormalizedError } from './errors.js';

export interface OutputOpts {
  format: 'json' | 'compact' | 'yaml' | 'table';
  fields?: string;
  quiet?: boolean;
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

function serialize(data: unknown, format: Exclude<OutputOpts['format'], 'table'>): string {
  if (format === 'compact') return JSON.stringify(data);
  if (format === 'yaml') return yaml.dump(data);
  return JSON.stringify(data, null, 2);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function cellValue(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function serializeTable(data: unknown): { output: string; fellBack: boolean } {
  if (Array.isArray(data)) {
    if (data.length === 0) return { output: JSON.stringify(data) + '\n', fellBack: true };
    if (!data.every(isPlainObject)) {
      return { output: JSON.stringify(data) + '\n', fellBack: true };
    }
    const rows = data as Record<string, unknown>[];
    const headers = Array.from(
      rows.reduce<Set<string>>((acc, r) => {
        for (const k of Object.keys(r)) acc.add(k);
        return acc;
      }, new Set<string>()),
    );
    const table = new Table({ head: headers });
    for (const r of rows) {
      table.push(headers.map((h) => cellValue(r[h])));
    }
    return { output: table.toString() + '\n', fellBack: false };
  }
  if (isPlainObject(data)) {
    const table = new Table({ head: ['key', 'value'] });
    for (const [k, v] of Object.entries(data)) table.push([k, cellValue(v)]);
    return { output: table.toString() + '\n', fellBack: false };
  }
  return { output: JSON.stringify(data) + '\n', fellBack: true };
}

export function stdout(data: unknown, opts: OutputOpts): void {
  const filtered = opts.fields ? filterFields(data, opts.fields) : data;
  if (opts.format === 'table') {
    const { output, fellBack } = serializeTable(filtered);
    process.stdout.write(output);
    if (fellBack) {
      stderr('Table format not applicable for this response, falling back to JSON', {
        quiet: !!opts.quiet,
      });
    }
    return;
  }
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
