import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import PagesPortal from '../../../src/commands/pages/portal.js';

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

describe('pages portal', () => {
  test('happy path returns portal details', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/portals/PT-1')
      .reply(200, { ID: 'PT-1' });

    captured = captureOutput();
    await PagesPortal.run(['PT-1']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ ID: 'PT-1' });
  });

  test('URL-encodes the portal id', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const idWithSpace = 'My Portal';
    const scope = nock('https://pega.example.com')
      .get(`/prweb/api/application/v2/portals/${encodeURIComponent(idWithSpace)}`)
      .reply(200, { ID: idWithSpace });

    captured = captureOutput();
    await PagesPortal.run([idWithSpace]);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run emits GET request without network call', async () => {
    captured = captureOutput();
    await PagesPortal.run(['PT-1', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/portals/PT-1');
  });

  test('404 emits structured error and exits 1', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/portals/MISSING')
      .reply(404, { localizedValue: 'Not found' });

    captured = captureOutput();
    await expect(PagesPortal.run(['MISSING'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
