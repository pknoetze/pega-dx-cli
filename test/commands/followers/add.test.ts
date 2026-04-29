import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: FollowersAdd } = await import('../../../src/commands/followers/add.js');

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

describe('followers add', () => {
  test('happy path: POSTs body { user: "U1" }', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .post('/prweb/api/application/v2/cases/MYAPP-CASE-1/followers', { user: 'U1' })
      .reply(201, { added: true });

    captured = captureOutput();
    await FollowersAdd.run(['MYAPP-CASE-1', '--user', 'U1']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ added: true });
  });

  test('--dry-run shows POST, Content-Type, Authorization redacted, body', async () => {
    captured = captureOutput();
    await FollowersAdd.run(['MYAPP-CASE-1', '--user', 'U1', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('POST');
    expect(out.headers['Content-Type']).toBe('application/json');
    expect(out.headers.Authorization).toBe('[REDACTED]');
    expect(out.body).toEqual({ user: 'U1' });
  });

  test('rejects without --user (oclif parse error → exit 2)', async () => {
    captured = captureOutput();
    let caughtError: { oclif?: { exit?: number } } | undefined;
    try {
      await FollowersAdd.run(['MYAPP-CASE-1']);
    } catch (e) {
      caughtError = e as { oclif?: { exit?: number } };
    }
    expect(caughtError?.oclif?.exit).toBe(2);
  });

  test('URL-encodes special characters in caseId', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .post('/prweb/api/application/v2/cases/MYAPP-CASE-1/followers', { user: 'a@b.com' })
      .reply(201, { added: true });

    captured = captureOutput();
    await FollowersAdd.run(['MYAPP-CASE-1', '--user', 'a@b.com']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ added: true });
  });
});
