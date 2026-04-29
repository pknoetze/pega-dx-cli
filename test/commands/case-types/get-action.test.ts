import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: CaseTypesGetAction } = await import('../../../src/commands/case-types/get-action.js');

let captured: CapturedOutput;
let origEmitWarning: typeof process.emitWarning;

beforeEach(() => {
  resetMockFs();
  process.env.HOME = '/home/test';
  process.env.PEGA_BASE_URL = 'https://pega.example.com';
  process.env.PEGA_CLIENT_ID = 'cid';
  process.env.PEGA_CLIENT_SECRET = 'sec';
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
  cleanupNock();
  captured?.restore();
  process.emitWarning = origEmitWarning;
  delete process.env.PEGA_BASE_URL;
  delete process.env.PEGA_CLIENT_ID;
  delete process.env.PEGA_CLIENT_SECRET;
  delete process.env.PEGA_NO_CACHE;
  delete process.env.HOME;
});

describe('case-types get-action', () => {
  test('happy path: GETs /casetypes/{id}/actions/{action}', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/casetypes/MYAPP-WORK-CASE/actions/pyStartCase')
      .reply(200, { name: 'pyStartCase', type: 'CreateCase' });

    captured = captureOutput();
    await CaseTypesGetAction.run(['MYAPP-WORK-CASE', '--action', 'pyStartCase']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ name: 'pyStartCase', type: 'CreateCase' });
  });

  test('--dry-run shows GET method, correct URL, Authorization redacted, no Content-Type', async () => {
    captured = captureOutput();
    await CaseTypesGetAction.run(['MYAPP-WORK-CASE', '--action', 'pyStartCase', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toBe(
      'https://pega.example.com/prweb/api/application/v2/casetypes/MYAPP-WORK-CASE/actions/pyStartCase',
    );
    expect(out.headers.Authorization).toBe('[REDACTED]');
    expect(out.headers['Content-Type']).toBeUndefined();
  });

  test('rejects without --action', async () => {
    captured = captureOutput();
    let caughtError: { oclif?: { exit?: number } } | undefined;
    try {
      await CaseTypesGetAction.run(['MYAPP-WORK-CASE']);
    } catch (e) {
      caughtError = e as { oclif?: { exit?: number } };
    }
    expect(caughtError?.oclif?.exit).toBe(2);
  });
});
