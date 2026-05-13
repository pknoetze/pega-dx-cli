import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import UiListsDeletePersonalization from '../../../src/commands/ui-lists/delete-personalization.js';

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

describe('ui-lists delete-personalization', () => {
  test('happy path DELETEs correct URL', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .delete('/prweb/api/application/v2/ui_lists/LIST-1/personalizations/PERS-1')
      .reply(200, { deleted: true });

    captured = captureOutput();
    await UiListsDeletePersonalization.run(['LIST-1', 'PERS-1']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ deleted: true });
  });

  test('URL-encodes both uiListID and personalizationID', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const listID = 'LIST with space';
    const persID = 'PERS/slash';
    const scope = nock('https://pega.example.com')
      .delete(
        `/prweb/api/application/v2/ui_lists/${encodeURIComponent(listID)}/personalizations/${encodeURIComponent(persID)}`,
      )
      .reply(200, { deleted: true });

    captured = captureOutput();
    await UiListsDeletePersonalization.run([listID, persID]);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run shows DELETE with no body', async () => {
    captured = captureOutput();
    await UiListsDeletePersonalization.run(['LIST-1', 'PERS-1', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('DELETE');
    expect(out.url).toBe(
      'https://pega.example.com/prweb/api/application/v2/ui_lists/LIST-1/personalizations/PERS-1',
    );
    expect(out.body).toBeUndefined();
  });

  test('404 emits structured error', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .delete('/prweb/api/application/v2/ui_lists/LIST-1/personalizations/MISSING')
      .reply(404, { localizedValue: 'Not found' });

    captured = captureOutput();
    await expect(UiListsDeletePersonalization.run(['LIST-1', 'MISSING'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
