import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: DataUpdate } = await import('../../../src/commands/data/update.js');

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

describe('data update', () => {
  test('PUTs directly to data/{id} with {data:{...}} - no eTag fetch', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .put('/prweb/api/application/v2/data/D_MyView', { data: { field: 'value' } })
      .reply(200, { updated: true });

    captured = captureOutput();
    await DataUpdate.run(['D_MyView', '--data', '{"field":"value"}']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ updated: true });
  });

  test('URL-encodes the dataViewId', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const id = 'D_My View';
    const encoded = encodeURIComponent(id);
    expect(encoded).toContain('%20');
    const scope = nock('https://pega.example.com')
      .put(`/prweb/api/application/v2/data/${encoded}`, { data: { field: 'value' } })
      .reply(200, { updated: true });

    captured = captureOutput();
    await DataUpdate.run([id, '--data', '{"field":"value"}']);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run emits PUT method with correct URL and no network call', async () => {
    captured = captureOutput();
    await DataUpdate.run(['D_MyView', '--data', '{"field":"value"}', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('PUT');
    expect(out.url).toBe(
      'https://pega.example.com/prweb/api/application/v2/data/D_MyView',
    );
  });
});
