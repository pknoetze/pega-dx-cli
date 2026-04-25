import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: CasesGet } = await import('../../../src/commands/cases/get.js');

let captured: CapturedOutput;
let origEmitWarning: typeof process.emitWarning;

beforeEach(() => {
  resetMockFs();
  process.env.HOME = '/home/test';
  process.env.PEGA_BASE_URL = 'https://pega.example.com';
  process.env.PEGA_CLIENT_ID = 'id';
  process.env.PEGA_CLIENT_SECRET = 's';
  process.env.PEGA_NO_CACHE = 'true';
  if (!nock.isActive()) nock.activate();
  origEmitWarning = process.emitWarning;
  process.emitWarning = (warning: string | Error, ...args: unknown[]) => {
    const msg = typeof warning === 'string'
      ? warning
      : ((warning as { message?: string }).message ?? String(warning));
    origEmitWarning.call(process, msg, ...(args as []));
  };
});

afterEach(() => {
  nock.cleanAll();
  captured?.restore();
  process.emitWarning = origEmitWarning;
});

describe('cases get', () => {
  test('emits case JSON on success', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/MYAPP-CASE-1')
      .reply(200, { id: 'MYAPP-CASE-1', status: 'Open' });

    captured = captureOutput();
    await CasesGet.run(['MYAPP-CASE-1']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ id: 'MYAPP-CASE-1', status: 'Open' });
  });

  test('URL-encodes the case ID', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/MY%20APP-CASE-1')
      .reply(200, { id: 'x' });

    captured = captureOutput();
    await CasesGet.run(['MY APP-CASE-1']);
    expect(JSON.parse(captured.stdout.join('')).id).toBe('x');
  });

  test('--dry-run prints redacted request and exits 0 without network call', async () => {
    captured = captureOutput();
    await CasesGet.run(['C-1', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/cases/C-1');
    expect(out.headers.Authorization).toBe('[REDACTED]');
    // No nock intercept set up, so if a request were made the test would fail.
  });

  test('--fields filters top-level keys', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/C-1')
      .reply(200, { id: 'C-1', status: 'Open', extraField: 'drop' });

    captured = captureOutput();
    await CasesGet.run(['C-1', '--fields', 'id,status']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ id: 'C-1', status: 'Open' });
  });

  test('404 emits structured error and exits 1', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/MISSING')
      .reply(404, { localizedValue: 'Case not found' });

    captured = captureOutput();
    await expect(CasesGet.run(['MISSING'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
