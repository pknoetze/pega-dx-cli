import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import PagesGetWithContext from '../../../src/commands/pages/get-with-context.js';

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

describe('pages get-with-context', () => {
  test('happy path POSTs { dataContext } body', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .post('/prweb/api/application/v2/pages/PG-1', { dataContext: 'CTX-VAL' })
      .reply(200, { ID: 'PG-1' });

    captured = captureOutput();
    await PagesGetWithContext.run(['PG-1', '--data-context', 'CTX-VAL']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ ID: 'PG-1' });
  });

  test('URL-encodes the pageID', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const pageID = 'PG with space';
    const scope = nock('https://pega.example.com')
      .post(`/prweb/api/application/v2/pages/${encodeURIComponent(pageID)}`, { dataContext: 'X' })
      .reply(200, {});

    captured = captureOutput();
    await PagesGetWithContext.run([pageID, '--data-context', 'X']);
    expect(scope.isDone()).toBe(true);
  });

  test('missing --data-context → oclif required-flag error (rejects, no network)', async () => {
    captured = captureOutput();
    await expect(PagesGetWithContext.run(['PG-1'])).rejects.toThrow();
  });

  test('empty --data-context → INVALID_ARGS without network call', async () => {
    captured = captureOutput();
    await expect(PagesGetWithContext.run(['PG-1', '--data-context', ''])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'INVALID_ARGS' });
  });

  test('--dry-run emits POST with body, no network', async () => {
    captured = captureOutput();
    await PagesGetWithContext.run(['PG-1', '--data-context', 'CTX', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('POST');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/pages/PG-1');
    expect(out.body).toEqual({ dataContext: 'CTX' });
  });

  test('404 emits structured error and exits 1', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .post('/prweb/api/application/v2/pages/MISSING')
      .reply(404, { localizedValue: 'Not found' });

    captured = captureOutput();
    await expect(PagesGetWithContext.run(['MISSING', '--data-context', 'X'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
