import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import DataListActions from '../../../src/commands/data/list-actions.js';

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
    const msg =
      typeof warning === 'string'
        ? warning
        : ((warning as { message?: string }).message ?? String(warning));
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

describe('data list-actions', () => {
  test('POSTs to /data/{dataViewId}/actions with empty body', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .post('/prweb/api/application/v2/data/D_MyView/actions', {})
      .reply(200, { actions: [] });

    captured = captureOutput();
    await DataListActions.run(['D_MyView']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ actions: [] });
  });

  test('URL-encodes the dataViewId', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const id = 'D_My View';
    const encoded = encodeURIComponent(id);
    expect(encoded).toContain('%20');
    const scope = nock('https://pega.example.com')
      .post(`/prweb/api/application/v2/data/${encoded}/actions`, {})
      .reply(200, { actions: [] });

    captured = captureOutput();
    await DataListActions.run([id]);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run emits POST method with correct URL and no network call', async () => {
    captured = captureOutput();
    await DataListActions.run(['D_MyView', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('POST');
    expect(out.url).toBe(
      'https://pega.example.com/prweb/api/application/v2/data/D_MyView/actions',
    );
  });
});
