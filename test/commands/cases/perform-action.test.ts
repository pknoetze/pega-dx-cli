import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: CasesPerformAction } = await import('../../../src/commands/cases/perform-action.js');

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
  cleanupNock();
  captured?.restore();
  process.emitWarning = origEmitWarning;
  delete process.env.PEGA_BASE_URL;
  delete process.env.PEGA_CLIENT_ID;
  delete process.env.PEGA_CLIENT_SECRET;
  delete process.env.PEGA_NO_CACHE;
  delete process.env.HOME;
});

describe('cases perform-action', () => {
  test('GETs case for eTag, then PATCHes action with body { content: ... }', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/MYAPP-CASE-1')
      .reply(200, { id: 'MYAPP-CASE-1' }, { ETag: '"e1"' });
    nock('https://pega.example.com')
      .patch(
        '/prweb/api/application/v2/cases/MYAPP-CASE-1/actions/Approve',
        { content: { reason: 'OK' } },
      )
      .matchHeader('If-Match', '"e1"')
      .reply(200, { performed: true });

    captured = captureOutput();
    await CasesPerformAction.run(['MYAPP-CASE-1', '--action', 'Approve', '--data', '{"reason":"OK"}']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ performed: true });
  });

  test('without --data PATCHes with empty body {}', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/MYAPP-CASE-1')
      .reply(200, { id: 'MYAPP-CASE-1' }, { ETag: '"e2"' });
    nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/cases/MYAPP-CASE-1/actions/Approve', {})
      .matchHeader('If-Match', '"e2"')
      .reply(200, { performed: true });

    captured = captureOutput();
    await CasesPerformAction.run(['MYAPP-CASE-1', '--action', 'Approve']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ performed: true });
  });

  test('--dry-run shows PATCH + If-Match placeholder + Authorization redacted + body', async () => {
    captured = captureOutput();
    await CasesPerformAction.run(['MYAPP-CASE-1', '--action', 'Approve', '--data', '{"k":"v"}', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('PATCH');
    expect(out.url).toBe(
      'https://pega.example.com/prweb/api/application/v2/cases/MYAPP-CASE-1/actions/Approve',
    );
    expect(out.headers.Authorization).toBe('[REDACTED]');
    expect(out.headers['If-Match']).toBe('<etag-from-GET>');
    expect(out.body).toEqual({ content: { k: 'v' } });
  });
});
