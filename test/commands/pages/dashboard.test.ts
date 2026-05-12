import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import PagesDashboard from '../../../src/commands/pages/dashboard.js';

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

describe('pages dashboard', () => {
  test('happy path returns dashboard details', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/dashboard/DB-1')
      .reply(200, { ID: 'DB-1' });

    captured = captureOutput();
    await PagesDashboard.run(['DB-1']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ ID: 'DB-1' });
  });

  test('URL-encodes the dashboard id', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const idWithSpace = 'My Dashboard';
    const scope = nock('https://pega.example.com')
      .get(`/prweb/api/application/v2/dashboard/${encodeURIComponent(idWithSpace)}`)
      .reply(200, { ID: idWithSpace });

    captured = captureOutput();
    await PagesDashboard.run([idWithSpace]);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run emits GET request without network call', async () => {
    captured = captureOutput();
    await PagesDashboard.run(['DB-1', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/dashboard/DB-1');
  });

  test('404 emits structured error and exits 1', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/dashboard/MISSING')
      .reply(404, { localizedValue: 'Not found' });

    captured = captureOutput();
    await expect(PagesDashboard.run(['MISSING'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
