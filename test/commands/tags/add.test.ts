import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: TagsAdd } = await import('../../../src/commands/tags/add.js');

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

describe('tags add', () => {
  test('happy path multi-tag: POSTs body { tags: ["urgent", "review"] }', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .post('/prweb/api/application/v2/cases/MYAPP-CASE-1/tags', { tags: ['urgent', 'review'] })
      .reply(200, { tags: ['urgent', 'review'] });

    captured = captureOutput();
    await TagsAdd.run(['MYAPP-CASE-1', '--tag', 'urgent', '--tag', 'review']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ tags: ['urgent', 'review'] });
  });

  test('single --tag still wraps in array', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .post('/prweb/api/application/v2/cases/MYAPP-CASE-1/tags', { tags: ['urgent'] })
      .reply(200, { tags: ['urgent'] });

    captured = captureOutput();
    await TagsAdd.run(['MYAPP-CASE-1', '--tag', 'urgent']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ tags: ['urgent'] });
  });

  test('--dry-run shows POST, Content-Type, Authorization redacted, body array', async () => {
    captured = captureOutput();
    await TagsAdd.run(['MYAPP-CASE-1', '--tag', 'urgent', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('POST');
    expect(out.headers['Content-Type']).toBe('application/json');
    expect(out.headers.Authorization).toBe('[REDACTED]');
    expect(out.body).toEqual({ tags: ['urgent'] });
  });

  test('rejects without --tag (oclif parse error → exit 2)', async () => {
    captured = captureOutput();
    let caughtError: { oclif?: { exit?: number } } | undefined;
    try {
      await TagsAdd.run(['MYAPP-CASE-1']);
    } catch (e) {
      caughtError = e as { oclif?: { exit?: number } };
    }
    expect(caughtError?.oclif?.exit).toBe(2);
  });
});
