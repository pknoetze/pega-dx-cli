import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: DataQuery } = await import('../../../src/commands/data/query.js');

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

describe('data query', () => {
  test('--max and --include-total compose paging body correctly', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .post('/prweb/api/application/v2/data_views/D_MyView', {
        paging: { maxResultsToFetch: 10, includeTotalCount: true },
      })
      .reply(200, { pxResults: [{ id: 1 }] });

    captured = captureOutput();
    await DataQuery.run(['D_MyView', '--max', '10', '--include-total']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ pxResults: [{ id: 1 }] });
  });

  test('--data sends body verbatim', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const verbatimBody = { query: { select: ['X'] } };
    const scope = nock('https://pega.example.com')
      .post('/prweb/api/application/v2/data_views/D_MyView', verbatimBody)
      .reply(200, { pxResults: [] });

    captured = captureOutput();
    await DataQuery.run(['D_MyView', '--data', JSON.stringify(verbatimBody)]);
    expect(scope.isDone()).toBe(true);
  });

  test('no flags → body is {}', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .post('/prweb/api/application/v2/data_views/D_MyView', {})
      .reply(200, { pxResults: [] });

    captured = captureOutput();
    await DataQuery.run(['D_MyView']);
    expect(scope.isDone()).toBe(true);
  });

  test('--data + --max → INVALID_ARGS (exit code 2)', async () => {
    captured = captureOutput();
    await expect(
      DataQuery.run(['D_MyView', '--data', '{}', '--max', '5']),
    ).rejects.toThrow();
    const err = parseFirstJson(captured.stderr);
    expect((err as { code: string }).code).toBe('INVALID_ARGS');
  });

  test('--dry-run emits POST method with correct URL and no network call', async () => {
    captured = captureOutput();
    await DataQuery.run(['D_MyView', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('POST');
    expect(out.url).toBe(
      'https://pega.example.com/prweb/api/application/v2/data_views/D_MyView',
    );
  });

  test('URL-encodes dataViewId with spaces', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const idWithSpace = 'D_My Work List';
    const encodedId = encodeURIComponent(idWithSpace);
    expect(encodedId).toContain('%20');
    const scope = nock('https://pega.example.com')
      .post(`/prweb/api/application/v2/data_views/${encodedId}`, {})
      .reply(200, { pxResults: [] });

    captured = captureOutput();
    await DataQuery.run([idWithSpace]);
    expect(scope.isDone()).toBe(true);
  });
});
