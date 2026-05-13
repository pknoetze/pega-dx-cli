import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import RecentsList from '../../../src/commands/recents/list.js';

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

describe('recents list', () => {
  test('happy path (no flags) fetches GET /recents', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .get('/prweb/api/application/v2/recents')
      .reply(200, { recentItems: [] });

    captured = captureOutput();
    await RecentsList.run([]);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ recentItems: [] });
  });

  test('--max-results 20 appends ?maxResultsToFetch=20', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .get('/prweb/api/application/v2/recents')
      .query({ maxResultsToFetch: '20' })
      .reply(200, { recentItems: [] });

    captured = captureOutput();
    await RecentsList.run(['--max-results', '20']);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run emits GET with correct URL', async () => {
    captured = captureOutput();
    await RecentsList.run(['--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/recents');
  });

  test('--dry-run with --max-results includes query string in URL', async () => {
    captured = captureOutput();
    await RecentsList.run(['--max-results', '10', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/recents?maxResultsToFetch=10');
  });

  test('404 emits structured error', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/recents')
      .reply(404, { localizedValue: 'Not found' });

    captured = captureOutput();
    await expect(RecentsList.run([])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
