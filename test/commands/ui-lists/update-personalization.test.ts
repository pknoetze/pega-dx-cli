import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import UiListsUpdatePersonalization from '../../../src/commands/ui-lists/update-personalization.js';

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

describe('ui-lists update-personalization', () => {
  test('happy path PUTs to correct URL with body', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .put('/prweb/api/application/v2/ui_lists/LIST-1/personalizations/PERS-1', { name: 'Edited' })
      .reply(200, { name: 'Edited' });

    captured = captureOutput();
    await UiListsUpdatePersonalization.run(['LIST-1', 'PERS-1', '--name', 'Edited']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ name: 'Edited' });
  });

  test('URL-encodes both uiListID and personalizationID', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const listID = 'LIST with space';
    const persID = 'PERS/slash';
    const scope = nock('https://pega.example.com')
      .put(
        `/prweb/api/application/v2/ui_lists/${encodeURIComponent(listID)}/personalizations/${encodeURIComponent(persID)}`,
        { name: 'Edited' },
      )
      .reply(200, { name: 'Edited' });

    captured = captureOutput();
    await UiListsUpdatePersonalization.run([listID, persID, '--name', 'Edited']);
    expect(scope.isDone()).toBe(true);
  });

  test('missing --name rejects with exit code 2', async () => {
    let caughtError: { oclif?: { exit?: number } } | undefined;
    try {
      await UiListsUpdatePersonalization.run(['LIST-1', 'PERS-1']);
    } catch (e) {
      caughtError = e as { oclif?: { exit?: number } };
    }
    expect(caughtError?.oclif?.exit).toBe(2);
  });

  test('--dry-run shows PUT with body', async () => {
    captured = captureOutput();
    await UiListsUpdatePersonalization.run(['LIST-1', 'PERS-1', '--name', 'Edited', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('PUT');
    expect(out.url).toBe(
      'https://pega.example.com/prweb/api/application/v2/ui_lists/LIST-1/personalizations/PERS-1',
    );
    expect(out.body).toEqual({ name: 'Edited' });
  });

  test('404 emits structured error', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .put('/prweb/api/application/v2/ui_lists/LIST-1/personalizations/MISSING')
      .reply(404, { localizedValue: 'Not found' });

    captured = captureOutput();
    await expect(
      UiListsUpdatePersonalization.run(['LIST-1', 'MISSING', '--name', 'Edited']),
    ).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
