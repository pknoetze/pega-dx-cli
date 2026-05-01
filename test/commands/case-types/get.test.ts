import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: CaseTypesGet } = await import('../../../src/commands/case-types/get.js');

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

describe('case-types get', () => {
  test('GETs /casetypes and filters by ID', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/casetypes')
      .reply(200, {
        caseTypes: [
          { ID: 'OTHER-CASE', name: 'Other' },
          { ID: 'TARGET-CASE', name: 'Target', stages: [] },
        ],
      });

    captured = captureOutput();
    await CaseTypesGet.run(['TARGET-CASE']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({
      ID: 'TARGET-CASE',
      name: 'Target',
      stages: [],
    });
  });

  test('not found in list → exits 1 with NOT_FOUND', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/casetypes')
      .reply(200, { caseTypes: [{ ID: 'OTHER-CASE' }] });

    captured = captureOutput();
    let caughtError: { oclif?: { exit?: number } } | undefined;
    try {
      await CaseTypesGet.run(['MISSING']);
    } catch (e) {
      caughtError = e as { oclif?: { exit?: number } };
    }
    expect(caughtError?.oclif?.exit).toBe(1);
    expect(captured.stderr.join('')).toContain('NOT_FOUND');
  });
});
