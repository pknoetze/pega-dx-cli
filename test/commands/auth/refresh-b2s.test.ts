import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import AuthRefreshB2S from '../../../src/commands/auth/refresh-b2s.js';

let captured: CapturedOutput;
let origEmitWarning: typeof process.emitWarning;

beforeEach(() => {
  process.env.PEGA_BASE_URL = 'https://pega.example.com';
  process.env.PEGA_CLIENT_ID = 'cid';
  process.env.PEGA_CLIENT_SECRET = 'sec';
  process.env.PEGA_NO_CACHE = 'true';
  if (!nock.isActive()) nock.activate();
  origEmitWarning = process.emitWarning;
  process.emitWarning = (warning: string | Error, ...args: unknown[]) => {
    const msg = typeof warning === 'string' ? warning : ((warning as { message?: string }).message ?? String(warning));
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
});

describe('auth refresh-b2s', () => {
  test('POSTs { B2SToken } to /refreshB2S and emits JSON response', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .post('/prweb/api/application/v2/refreshB2S', { B2SToken: 'old-token' })
      .reply(200, { accessToken: 'new-token', expiresIn: 3600 });

    captured = captureOutput();
    await AuthRefreshB2S.run(['--token', 'old-token']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.accessToken).toBe('new-token');
    expect(out.expiresIn).toBe(3600);
  });

  test('--dry-run emits POST with body { B2SToken } and correct URL without hitting network', async () => {
    captured = captureOutput();
    await AuthRefreshB2S.run(['--token', 'old-token', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('POST');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/refreshB2S');
    expect(out.body).toEqual({ B2SToken: 'old-token' });
  });

  test('missing --token flag rejects before making network call', async () => {
    captured = captureOutput();
    await expect(AuthRefreshB2S.run([])).rejects.toThrow();
    // No network call should have been made
    expect(nock.pendingMocks()).toHaveLength(0);
  });

  test('404 from POST emits structured error { error: true, code: NOT_FOUND, httpStatus: 404 }', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .post('/prweb/api/application/v2/refreshB2S')
      .reply(404, { localizedValue: 'Token not found' });

    captured = captureOutput();
    await expect(AuthRefreshB2S.run(['--token', 'bad-token'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
