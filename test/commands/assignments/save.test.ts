import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: AssignmentsSave } = await import('../../../src/commands/assignments/save.js');

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

describe('assignments save', () => {
  test('GETs assignment for eTag, then PATCHes save with body', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/ASSIGN-1')
      .reply(200, { id: 'ASSIGN-1' }, { ETag: '"e1"' });
    nock('https://pega.example.com')
      .patch(
        '/prweb/api/application/v2/assignments/ASSIGN-1/actions/Submit/save',
        { content: { foo: 'bar' } },
      )
      .matchHeader('If-Match', '"e1"')
      .reply(200, { saved: true });

    captured = captureOutput();
    await AssignmentsSave.run(['ASSIGN-1', '--action', 'Submit', '--data', '{"foo":"bar"}']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ saved: true });
  });

  test('without --data PATCHes empty body {}', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/ASSIGN-1')
      .reply(200, { id: 'ASSIGN-1' }, { ETag: '"e2"' });
    nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/assignments/ASSIGN-1/actions/Submit/save', {})
      .matchHeader('If-Match', '"e2"')
      .reply(200, { saved: true });

    captured = captureOutput();
    await AssignmentsSave.run(['ASSIGN-1', '--action', 'Submit']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ saved: true });
  });

  test('--dry-run shows PATCH + If-Match placeholder + Authorization redacted + body', async () => {
    captured = captureOutput();
    await AssignmentsSave.run(['ASSIGN-1', '--action', 'Submit', '--data', '{"k":"v"}', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('PATCH');
    expect(out.url).toBe(
      'https://pega.example.com/prweb/api/application/v2/assignments/ASSIGN-1/actions/Submit/save',
    );
    expect(out.headers.Authorization).toBe('[REDACTED]');
    expect(out.headers['If-Match']).toBe('<etag-from-GET>');
    expect(out.body).toEqual({ content: { k: 'v' } });
  });

  test('rejects without --action', async () => {
    captured = captureOutput();
    let caughtError: { oclif?: { exit?: number } } | undefined;
    try {
      await AssignmentsSave.run(['ASSIGN-1']);
    } catch (e) {
      caughtError = e as { oclif?: { exit?: number } };
    }
    expect(caughtError?.oclif?.exit).toBe(2);
  });
});
