import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: DataPatch } = await import('../../../src/commands/data/patch.js');

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
});

describe('data patch', () => {
  test('GETs eTag from data_views/{id} then PATCHes data/{id}', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/data_views/D_MyView')
      .reply(200, { dataViewId: 'D_MyView' }, { ETag: 'etag-v2' });
    const scope = nock('https://pega.example.com', { reqheaders: { 'if-match': 'etag-v2' } })
      .patch('/prweb/api/application/v2/data/D_MyView', { field: 'patched' })
      .reply(200, { patched: true });

    captured = captureOutput();
    await DataPatch.run(['D_MyView', '--data', '{"field":"patched"}']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ patched: true });
  });

  test('URL-encodes the dataViewId', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    const id = 'D_My View';
    const encoded = encodeURIComponent(id);
    expect(encoded).toContain('%20');
    nock('https://pega.example.com')
      .get(`/prweb/api/application/v2/data_views/${encoded}`)
      .reply(200, { dataViewId: id }, { ETag: 'etag-enc' });
    const scope = nock('https://pega.example.com', { reqheaders: { 'if-match': 'etag-enc' } })
      .patch(`/prweb/api/application/v2/data/${encoded}`, { field: 'patched' })
      .reply(200, { patched: true });

    captured = captureOutput();
    await DataPatch.run([id, '--data', '{"field":"patched"}']);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run emits PATCH method with correct URL and no network call', async () => {
    captured = captureOutput();
    await DataPatch.run(['D_MyView', '--data', '{"field":"patched"}', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('PATCH');
    expect(out.url).toBe(
      'https://pega.example.com/prweb/api/application/v2/data/D_MyView',
    );
  });
});
