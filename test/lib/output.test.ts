import { describe, test, expect, afterEach, beforeEach, jest } from '@jest/globals';
import { stdout, stderr, error, dryRun, redactAuthHeader } from '../../src/lib/output.js';
import { captureOutput, type CapturedOutput } from '../helpers/capture-output.js';

let captured: CapturedOutput;
afterEach(() => captured?.restore());

describe('stdout', () => {
  test('writes pretty JSON + newline by default', () => {
    captured = captureOutput();
    stdout({ a: 1, b: 2 }, { format: 'json' });
    expect(captured.stdout.join('')).toBe('{\n  "a": 1,\n  "b": 2\n}\n');
    expect(captured.stderr.join('')).toBe('');
  });

  test('writes minified JSON + newline when format=compact', () => {
    captured = captureOutput();
    stdout({ a: 1, b: 2 }, { format: 'compact' });
    expect(captured.stdout.join('')).toBe('{"a":1,"b":2}\n');
  });

  test('filters to only listed fields when fields is provided', () => {
    captured = captureOutput();
    stdout({ a: 1, b: 2, c: 3 }, { format: 'compact', fields: 'a,c' });
    expect(captured.stdout.join('')).toBe('{"a":1,"c":3}\n');
  });

  test('fields filter trims whitespace', () => {
    captured = captureOutput();
    stdout({ a: 1, b: 2 }, { format: 'compact', fields: ' a , b ' });
    expect(captured.stdout.join('')).toBe('{"a":1,"b":2}\n');
  });
});

describe('stderr', () => {
  test('writes message + newline when quiet is false', () => {
    captured = captureOutput();
    stderr('hello', { quiet: false });
    expect(captured.stderr.join('')).toBe('hello\n');
    expect(captured.stdout.join('')).toBe('');
  });

  test('writes nothing when quiet is true', () => {
    captured = captureOutput();
    stderr('hello', { quiet: true });
    expect(captured.stderr.join('')).toBe('');
  });
});

describe('error', () => {
  test('always writes structured JSON to stderr', () => {
    captured = captureOutput();
    error({ code: 'NOT_FOUND', message: 'gone', httpStatus: 404 });
    const parsed = JSON.parse(captured.stderr.join(''));
    expect(parsed).toEqual({
      error: true,
      code: 'NOT_FOUND',
      message: 'gone',
      httpStatus: 404,
    });
    expect(captured.stdout.join('')).toBe('');
  });

  test('includes pegaErrorId when present', () => {
    captured = captureOutput();
    error({ code: 'NOT_FOUND', message: 'gone', httpStatus: 404, pegaErrorId: 'ERR-1' });
    const parsed = JSON.parse(captured.stderr.join(''));
    expect(parsed.pegaErrorId).toBe('ERR-1');
  });
});

describe('dryRun', () => {
  test('redacts Authorization header and writes to stdout', () => {
    captured = captureOutput();
    dryRun({
      method: 'GET',
      url: 'https://x.pega.com/cases/C-1',
      headers: { Authorization: 'Bearer secret', 'x-origin-channel': 'Web' },
    });
    const parsed = JSON.parse(captured.stdout.join(''));
    expect(parsed.headers.Authorization).toBe('[REDACTED]');
    expect(parsed.headers['x-origin-channel']).toBe('Web');
  });

  test('preserves body when present', () => {
    captured = captureOutput();
    dryRun({
      method: 'POST',
      url: 'https://x.pega.com/cases',
      headers: { Authorization: 'Bearer x' },
      body: { caseTypeID: 'Claim' },
    });
    const parsed = JSON.parse(captured.stdout.join(''));
    expect(parsed.body).toEqual({ caseTypeID: 'Claim' });
  });

  test('handles case-insensitive Authorization header', () => {
    captured = captureOutput();
    dryRun({
      method: 'GET',
      url: 'https://x',
      headers: { authorization: 'Bearer x', AUTHORIZATION: 'Bearer y' },
    });
    const parsed = JSON.parse(captured.stdout.join(''));
    expect(parsed.headers.authorization).toBe('[REDACTED]');
    expect(parsed.headers.AUTHORIZATION).toBe('[REDACTED]');
  });
});

describe('redactAuthHeader', () => {
  test('redacts Authorization (lowercase a)', () => {
    const out = redactAuthHeader({ authorization: 'Bearer abc' });
    expect(out).toEqual({ authorization: '[REDACTED]' });
  });
  test('redacts Authorization (uppercase A)', () => {
    const out = redactAuthHeader({ Authorization: 'Bearer abc' });
    expect(out).toEqual({ Authorization: '[REDACTED]' });
  });
  test('passes other headers through', () => {
    const out = redactAuthHeader({
      Authorization: 'Bearer abc',
      'Content-Type': 'application/json',
      'If-Match': '"etag-1"',
    });
    expect(out).toEqual({
      Authorization: '[REDACTED]',
      'Content-Type': 'application/json',
      'If-Match': '"etag-1"',
    });
  });
  test('returns empty object on empty input', () => {
    expect(redactAuthHeader({})).toEqual({});
  });
  test('does not mutate the input', () => {
    const input = { Authorization: 'Bearer abc' };
    redactAuthHeader(input);
    expect(input.Authorization).toBe('Bearer abc');
  });
});

describe('stdout --format table', () => {
  let stdoutSpy: jest.SpiedFunction<typeof process.stdout.write>;
  let stderrSpy: jest.SpiedFunction<typeof process.stderr.write>;

  beforeEach(() => {
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });
  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  test('renders array of flat objects as table with headers', () => {
    stdout([{ id: 'A', status: 'Open' }, { id: 'B', status: 'Closed' }], { format: 'table' });
    const out = stdoutSpy.mock.calls[0]![0] as string;
    expect(out).toContain('id');
    expect(out).toContain('status');
    expect(out).toContain('A');
    expect(out).toContain('Open');
    expect(out).toContain('B');
    expect(out).toContain('Closed');
    expect(stderrSpy).not.toHaveBeenCalled();
  });

  test('renders single object as two-column key/value table', () => {
    stdout({ id: 'CASE-1', status: 'Open' }, { format: 'table' });
    const out = stdoutSpy.mock.calls[0]![0] as string;
    expect(out).toContain('id');
    expect(out).toContain('CASE-1');
    expect(out).toContain('status');
    expect(out).toContain('Open');
  });

  test('stringifies nested values as compact JSON in cell', () => {
    stdout([{ id: 'A', actions: [{ id: 'Submit' }] }], { format: 'table' });
    const out = stdoutSpy.mock.calls[0]![0] as string;
    expect(out).toContain('[{"id":"Submit"}]');
  });

  test('stringifies nested values in single-object table', () => {
    stdout({ id: 'A', actions: [{ id: 'Submit' }] }, { format: 'table' });
    const out = stdoutSpy.mock.calls[0]![0] as string;
    expect(out).toContain('id');
    expect(out).toContain('A');
    expect(out).toContain('actions');
    expect(out).toContain('[{"id":"Submit"}]');
  });

  test('falls back to JSON for bare scalar with stderr warning', () => {
    stdout('hello', { format: 'table' });
    const stdoutOut = stdoutSpy.mock.calls[0]![0] as string;
    expect(stdoutOut).toBe('"hello"\n');
    const stderrOut = stderrSpy.mock.calls[0]![0] as string;
    expect(stderrOut).toContain('Table format not applicable');
  });

  test('falls back to JSON for null with stderr warning', () => {
    stdout(null, { format: 'table' });
    expect(stdoutSpy.mock.calls[0]![0]).toBe('null\n');
    expect(stderrSpy.mock.calls[0]![0]).toContain('Table format not applicable');
  });

  test('falls back to JSON for mixed-type array with stderr warning', () => {
    stdout([{ id: 'A' }, 'not an object'], { format: 'table' });
    expect(stdoutSpy.mock.calls[0]![0]).toBe('[{"id":"A"},"not an object"]\n');
    expect(stderrSpy.mock.calls[0]![0]).toContain('Table format not applicable');
  });

  test('falls back to JSON for empty array with stderr warning', () => {
    stdout([], { format: 'table' });
    expect(stdoutSpy.mock.calls[0]![0]).toBe('[]\n');
    expect(stderrSpy.mock.calls[0]![0]).toContain('Table format not applicable');
  });

  test('respects --fields before rendering', () => {
    stdout({ id: 'A', status: 'Open', urgency: 50 }, { format: 'table', fields: 'id,status' });
    const out = stdoutSpy.mock.calls[0]![0] as string;
    expect(out).toContain('id');
    expect(out).toContain('status');
    expect(out).not.toContain('urgency');
  });

  test('--quiet suppresses fallback warning but still emits JSON', () => {
    stdout('hello', { format: 'table', quiet: true });
    expect(stdoutSpy.mock.calls[0]![0]).toBe('"hello"\n');
    expect(stderrSpy).not.toHaveBeenCalled();
  });
});

describe('stdout --format yaml', () => {
  let writeSpy: ReturnType<typeof jest.spyOn>;
  beforeEach(() => {
    writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });
  afterEach(() => writeSpy.mockRestore());

  test('serialises object as block-style YAML', () => {
    stdout({ id: 'CASE-1', status: 'Open' }, { format: 'yaml' });
    const out = writeSpy.mock.calls[0][0] as string;
    expect(out).toContain('id: CASE-1');
    expect(out).toContain('status: Open');
    expect(out.endsWith('\n')).toBe(true);
  });

  test('serialises array of objects as YAML list', () => {
    stdout([{ id: 'CASE-1' }, { id: 'CASE-2' }], { format: 'yaml' });
    const out = writeSpy.mock.calls[0][0] as string;
    expect(out).toContain('- id: CASE-1');
    expect(out).toContain('- id: CASE-2');
  });

  test('respects --fields before serialising', () => {
    stdout({ id: 'CASE-1', status: 'Open', urgency: 50 }, { format: 'yaml', fields: 'id,status' });
    const out = writeSpy.mock.calls[0][0] as string;
    expect(out).toContain('id: CASE-1');
    expect(out).toContain('status: Open');
    expect(out).not.toContain('urgency');
  });
});
