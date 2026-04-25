import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, mockOAuthFailure } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: AuthDiagnose } = await import('../../../src/commands/auth/diagnose.js');

let captured: CapturedOutput;
let origEmitWarning: typeof process.emitWarning;

beforeEach(() => {
  resetMockFs();
  process.env.HOME = '/home/test';
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

describe('auth diagnose', () => {
  test('reports overall:pass when all checks pass', async () => {
    process.env.PEGA_BASE_URL = 'https://pega.example.com';
    process.env.PEGA_CLIENT_ID = 'id';
    process.env.PEGA_CLIENT_SECRET = 's';
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/casetypes')
      .reply(200, { caseTypes: [] });

    captured = captureOutput();
    await AuthDiagnose.run([]);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.overall).toBe('pass');
    expect(out.checks.map((c: { name: string }) => c.name)).toEqual([
      'baseUrl',
      'credentials',
      'oauth',
      'apiV2',
    ]);
    expect(out.checks.every((c: { status: string }) => c.status === 'pass')).toBe(true);
  });

  test('reports overall:fail when baseUrl missing', async () => {
    delete process.env.PEGA_BASE_URL;
    delete process.env.PEGA_CLIENT_ID;
    delete process.env.PEGA_CLIENT_SECRET;
    captured = captureOutput();
    await AuthDiagnose.run([]);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.overall).toBe('fail');
    expect(out.checks[0].status).toBe('fail');
  });

  test('reports oauth:fail when credentials are wrong', async () => {
    process.env.PEGA_BASE_URL = 'https://pega.example.com';
    process.env.PEGA_CLIENT_ID = 'id';
    process.env.PEGA_CLIENT_SECRET = 'wrong';
    mockOAuthFailure('https://pega.example.com', 401);
    captured = captureOutput();
    await AuthDiagnose.run([]);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.overall).toBe('fail');
    const oauthCheck = out.checks.find((c: { name: string }) => c.name === 'oauth');
    expect(oauthCheck.status).toBe('fail');
  });

  test('always exits 0 even when checks fail', async () => {
    delete process.env.PEGA_BASE_URL;
    captured = captureOutput();
    // Should resolve, not reject, even on fail.
    await expect(AuthDiagnose.run([])).resolves.toBeUndefined();
  });

  test('--dry-run prints OAuth request with redacted Authorization and exits 0', async () => {
    process.env.PEGA_BASE_URL = 'https://pega.example.com';
    process.env.PEGA_CLIENT_ID = 'id';
    process.env.PEGA_CLIENT_SECRET = 's';
    captured = captureOutput();
    await AuthDiagnose.run(['--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('POST');
    expect(out.url).toContain('/oauth2/v1/token');
    expect(out.headers.Authorization).toBe('[REDACTED]');
  });
});
