import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import PagesGet from '../../../src/commands/pages/get.js';

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

describe('pages get', () => {
  test('happy path (no page-class) returns page details', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .get('/prweb/api/application/v2/pages/PG-1')
      .reply(200, { ID: 'PG-1' });

    captured = captureOutput();
    await PagesGet.run(['PG-1']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ ID: 'PG-1' });
  });

  test('--page-class appends ?pageClass= to the URL', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .get('/prweb/api/application/v2/pages/PG-1')
      .query({ pageClass: 'CW-Work' })
      .reply(200, { ID: 'PG-1' });

    captured = captureOutput();
    await PagesGet.run(['PG-1', '--page-class', 'CW-Work']);
    expect(scope.isDone()).toBe(true);
  });

  test('URL-encodes both pageID and page-class', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const pageID = 'PG with space';
    const cls = 'CW Work!';
    const scope = nock('https://pega.example.com')
      .get(`/prweb/api/application/v2/pages/${encodeURIComponent(pageID)}`)
      .query({ pageClass: cls })
      .reply(200, { ID: pageID });

    captured = captureOutput();
    await PagesGet.run([pageID, '--page-class', cls]);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run with --page-class includes query string in URL', async () => {
    captured = captureOutput();
    await PagesGet.run(['PG-1', '--page-class', 'CW-Work', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/pages/PG-1?pageClass=CW-Work');
  });

  test('404 emits structured error and exits 1', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/pages/MISSING')
      .reply(404, { localizedValue: 'Not found' });

    captured = captureOutput();
    await expect(PagesGet.run(['MISSING'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
