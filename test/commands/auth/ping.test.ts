import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: AuthPing } = await import('../../../src/commands/auth/ping.js');

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

describe('auth ping', () => {
  test('reports reachable:true with responseTimeMs on success', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/casetypes')
      .reply(200, { caseTypes: [] });

    captured = captureOutput();
    await AuthPing.run([]);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.reachable).toBe(true);
    expect(typeof out.responseTimeMs).toBe('number');
  });

  test('reports reachable:false with error message on failure (exit 0)', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/casetypes')
      .reply(503, {});

    captured = captureOutput();
    await AuthPing.run([]);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.reachable).toBe(false);
    expect(out.error).toBeDefined();
  });

  test('--dry-run prints redacted GET request and exits 0 without network', async () => {
    captured = captureOutput();
    await AuthPing.run(['--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/casetypes');
    expect(out.headers.Authorization).toBe('[REDACTED]');
  });
});
