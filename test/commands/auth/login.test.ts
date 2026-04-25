import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, mockOAuthFailure } from '../../helpers/mock-pega-api.js';

/** Extract the first valid JSON object from captured stream output, ignoring node warnings. */
function parseFirstJson(lines: string[]): Record<string, unknown> {
  const combined = lines.join('');
  let searchFrom = 0;
  while (searchFrom < combined.length) {
    const start = combined.indexOf('{', searchFrom);
    if (start === -1) break;
    try {
      return JSON.parse(combined.slice(start));
    } catch {
      searchFrom = start + 1;
    }
  }
  throw new SyntaxError('No JSON object found in captured output');
}

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: AuthLogin } = await import('../../../src/commands/auth/login.js');

let captured: CapturedOutput;
let origEmitWarning: typeof process.emitWarning;

beforeEach(() => {
  resetMockFs();
  process.env.HOME = '/home/test';
  process.env.PEGA_BASE_URL = 'https://pega.example.com';
  process.env.PEGA_CLIENT_ID = 'id';
  process.env.PEGA_CLIENT_SECRET = 's';
  delete process.env.PEGA_NO_CACHE;
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

describe('auth login', () => {
  test('outputs authenticated:true with expiresAt on success', async () => {
    mockOAuthSuccess('https://pega.example.com', 'tk', 3600);
    captured = captureOutput();
    await AuthLogin.run([]);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.authenticated).toBe(true);
    expect(new Date(out.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  test('--dry-run prints OAuth request with redacted Authorization and exits 0', async () => {
    captured = captureOutput();
    await AuthLogin.run(['--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('POST');
    expect(out.url).toContain('/prweb/PRRestService/oauth2/v1/token');
    expect(out.headers.Authorization).toBe('[REDACTED]');
    expect(out.body).toBe('grant_type=client_credentials');
  });

  test('failed OAuth emits structured error and exits 1', async () => {
    mockOAuthFailure('https://pega.example.com', 401);
    captured = captureOutput();
    await expect(AuthLogin.run([])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr);
    expect(err.error).toBe(true);
    expect(err.code).toBe('UNAUTHORIZED');
  });
});
