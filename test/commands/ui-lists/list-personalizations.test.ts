import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import UiListsListPersonalizations from '../../../src/commands/ui-lists/list-personalizations.js';

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

describe('ui-lists list-personalizations', () => {
  test('happy path returns personalizations list', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .get('/prweb/api/application/v2/ui_lists/LIST-1/personalizations')
      .reply(200, { personalizations: [] });

    captured = captureOutput();
    await UiListsListPersonalizations.run(['LIST-1']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ personalizations: [] });
  });

  test('URL-encodes uiListID', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const listID = 'LIST with space';
    const scope = nock('https://pega.example.com')
      .get(`/prweb/api/application/v2/ui_lists/${encodeURIComponent(listID)}/personalizations`)
      .reply(200, { personalizations: [] });

    captured = captureOutput();
    await UiListsListPersonalizations.run([listID]);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run emits GET URL without network call', async () => {
    captured = captureOutput();
    await UiListsListPersonalizations.run(['LIST-1', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/ui_lists/LIST-1/personalizations');
  });

  test('404 emits structured error', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/ui_lists/MISSING/personalizations')
      .reply(404, { localizedValue: 'Not found' });

    captured = captureOutput();
    await expect(UiListsListPersonalizations.run(['MISSING'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
