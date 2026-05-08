import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: DataGetAction } = await import('../../../src/commands/data/get-action.js');

let captured: CapturedOutput;
let origEmitWarning: typeof process.emitWarning;

beforeEach(() => {
  resetMockFs();
  process.env.HOME = '/home/test';
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
  delete process.env.HOME;
});

describe('data get-action', () => {
  test('POSTs to /data/{dataViewId}/actions/{actionId} with empty body when no --data', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .post('/prweb/api/application/v2/data/D_MyView/actions/myAction', {})
      .reply(200, { actionData: true });

    captured = captureOutput();
    await DataGetAction.run(['D_MyView', '--action', 'myAction']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ actionData: true });
  });

  test('POSTs with --data body when provided', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .post('/prweb/api/application/v2/data/D_MyView/actions/myAction', { field: 'value' })
      .reply(200, { actionData: true });

    captured = captureOutput();
    await DataGetAction.run(['D_MyView', '--action', 'myAction', '--data', '{"field":"value"}']);
    expect(scope.isDone()).toBe(true);
  });

  test('URL-encodes dataViewId and actionId', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const id = 'D_My View';
    const action = 'my Action';
    const encId = encodeURIComponent(id);
    const encAction = encodeURIComponent(action);
    expect(encId).toContain('%20');
    expect(encAction).toContain('%20');
    const scope = nock('https://pega.example.com')
      .post(`/prweb/api/application/v2/data/${encId}/actions/${encAction}`, {})
      .reply(200, { actionData: true });

    captured = captureOutput();
    await DataGetAction.run([id, '--action', action]);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run emits POST method with correct URL and no network call', async () => {
    captured = captureOutput();
    await DataGetAction.run(['D_MyView', '--action', 'myAction', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('POST');
    expect(out.url).toBe(
      'https://pega.example.com/prweb/api/application/v2/data/D_MyView/actions/myAction',
    );
  });

  test('invalid --data JSON exits with INVALID_ARGS', async () => {
    captured = captureOutput();
    await expect(DataGetAction.run(['D_MyView', '--action', 'myAction', '--data', '{bad'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err.code).toBe('INVALID_ARGS');
  });
});
