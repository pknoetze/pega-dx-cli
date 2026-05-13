import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import UiListsMove from '../../../src/commands/ui-lists/move.js';

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

describe('ui-lists move', () => {
  test('happy path with minimal body', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/ui_lists/MyListView/move', {
        sourceID: 'R-1',
        destinationID: 'R-2',
      })
      .reply(200, { moved: true });

    captured = captureOutput();
    await UiListsMove.run(['MyListView', '--source-id', 'R-1', '--destination-id', 'R-2']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ moved: true });
  });

  test('all optional fields included in body', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/ui_lists/MyListView/move', {
        sourceID: 'R-1',
        destinationID: 'R-2',
        context: 'ctx1',
        listClass: 'My-List-Class',
      })
      .reply(200, { moved: true });

    captured = captureOutput();
    await UiListsMove.run([
      'MyListView',
      '--source-id', 'R-1',
      '--destination-id', 'R-2',
      '--context', 'ctx1',
      '--list-class', 'My-List-Class',
    ]);
    expect(scope.isDone()).toBe(true);
  });

  test('URL-encodes viewName', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const viewName = 'My List View';
    const scope = nock('https://pega.example.com')
      .patch(`/prweb/api/application/v2/ui_lists/${encodeURIComponent(viewName)}/move`, {
        sourceID: 'R-1',
        destinationID: 'R-2',
      })
      .reply(200, { moved: true });

    captured = captureOutput();
    await UiListsMove.run([viewName, '--source-id', 'R-1', '--destination-id', 'R-2']);
    expect(scope.isDone()).toBe(true);
  });

  test('missing required flags reject with exit code 2', async () => {
    let caughtError: { oclif?: { exit?: number } } | undefined;
    try {
      await UiListsMove.run(['MyListView']);
    } catch (e) {
      caughtError = e as { oclif?: { exit?: number } };
    }
    expect(caughtError?.oclif?.exit).toBe(2);
  });

  test('--dry-run shows PATCH with body', async () => {
    captured = captureOutput();
    await UiListsMove.run([
      'MyListView',
      '--source-id', 'R-1',
      '--destination-id', 'R-2',
      '--dry-run',
    ]);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('PATCH');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/ui_lists/MyListView/move');
    expect(out.body).toEqual({ sourceID: 'R-1', destinationID: 'R-2' });
  });

  test('400 error emits structured error', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/ui_lists/MyListView/move')
      .reply(400, { localizedValue: 'Bad request' });

    captured = captureOutput();
    await expect(UiListsMove.run(['MyListView', '--source-id', 'R-1', '--destination-id', 'R-2'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, httpStatus: 400 });
  });
});
