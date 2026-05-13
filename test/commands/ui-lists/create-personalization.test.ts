import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import UiListsCreatePersonalization from '../../../src/commands/ui-lists/create-personalization.js';

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

describe('ui-lists create-personalization', () => {
  test('happy path with only --name', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .post('/prweb/api/application/v2/ui_lists/LIST-1/personalizations', { name: 'My View' })
      .reply(200, { message: 'Accept' });

    captured = captureOutput();
    await UiListsCreatePersonalization.run(['LIST-1', '--name', 'My View']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ message: 'Accept' });
  });

  test('all optional flags forward to body', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .post('/prweb/api/application/v2/ui_lists/LIST-1/personalizations', {
        name: 'My View',
        ID: 'PERS-42',
        personalizationState: '{"cols":["a"]}',
        markAsDefault: true,
        markAsAppDefault: false,
        pyRouteToWorkbasket: 'WB-1',
      })
      .reply(200, { message: 'Accept' });

    captured = captureOutput();
    await UiListsCreatePersonalization.run([
      'LIST-1',
      '--name', 'My View',
      '--id', 'PERS-42',
      '--personalization-state', '{"cols":["a"]}',
      '--mark-as-default',
      '--no-mark-as-app-default',
      '--route-to-workbasket', 'WB-1',
    ]);
    expect(scope.isDone()).toBe(true);
  });

  test('--no-mark-as-default sets markAsDefault=false', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .post('/prweb/api/application/v2/ui_lists/LIST-1/personalizations', {
        name: 'X',
        markAsDefault: false,
      })
      .reply(200, { message: 'Accept' });

    captured = captureOutput();
    await UiListsCreatePersonalization.run(['LIST-1', '--name', 'X', '--no-mark-as-default']);
    expect(scope.isDone()).toBe(true);
  });

  test('missing --name rejects with exit code 2', async () => {
    let caughtError: { oclif?: { exit?: number } } | undefined;
    try {
      await UiListsCreatePersonalization.run(['LIST-1']);
    } catch (e) {
      caughtError = e as { oclif?: { exit?: number } };
    }
    expect(caughtError?.oclif?.exit).toBe(2);
  });

  test('--dry-run emits POST with body', async () => {
    captured = captureOutput();
    await UiListsCreatePersonalization.run(['LIST-1', '--name', 'My View', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('POST');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/ui_lists/LIST-1/personalizations');
    expect(out.body).toEqual({ name: 'My View' });
  });

  test('URL-encodes uiListID', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const listID = 'LIST with space';
    const scope = nock('https://pega.example.com')
      .post(`/prweb/api/application/v2/ui_lists/${encodeURIComponent(listID)}/personalizations`, {
        name: 'My View',
      })
      .reply(200, { message: 'Accept' });

    captured = captureOutput();
    await UiListsCreatePersonalization.run([listID, '--name', 'My View']);
    expect(scope.isDone()).toBe(true);
  });
});
