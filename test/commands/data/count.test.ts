import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: DataCount } = await import('../../../src/commands/data/count.js');

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

describe('data count', () => {
  test('no flags → body is {} and POSTs to /count', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .post('/prweb/api/application/v2/data_views/D_MyView/count', {})
      .reply(200, { count: 42 });

    captured = captureOutput();
    await DataCount.run(['D_MyView']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ count: 42 });
  });

  test('--params composes dataViewParameters body', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .post('/prweb/api/application/v2/data_views/D_MyView/count', {
        dataViewParameters: { employeeID: 'E1' },
      })
      .reply(200, { count: 5 });

    captured = captureOutput();
    await DataCount.run(['D_MyView', '--params', '{"employeeID":"E1"}']);
    expect(scope.isDone()).toBe(true);
  });

  test('--max is rejected (paging flags not valid for count)', async () => {
    captured = captureOutput();
    // oclif rejects unknown flags before command logic runs
    await expect(
      DataCount.run(['D_MyView', '--max', '5']),
    ).rejects.toThrow();
  });

  test('--include-total is rejected (paging flags not valid for count)', async () => {
    captured = captureOutput();
    await expect(
      DataCount.run(['D_MyView', '--include-total']),
    ).rejects.toThrow();
  });

  test('--dry-run emits POST method with correct /count URL', async () => {
    captured = captureOutput();
    await DataCount.run(['D_MyView', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('POST');
    expect(out.url).toBe(
      'https://pega.example.com/prweb/api/application/v2/data_views/D_MyView/count',
    );
  });

  test('URL-encodes dataViewId with spaces', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const idWithSpace = 'D_My Work List';
    const encodedId = encodeURIComponent(idWithSpace);
    expect(encodedId).toContain('%20');
    const scope = nock('https://pega.example.com')
      .post(`/prweb/api/application/v2/data_views/${encodedId}/count`, {})
      .reply(200, { count: 0 });

    captured = captureOutput();
    await DataCount.run([idWithSpace]);
    expect(scope.isDone()).toBe(true);
  });
});
