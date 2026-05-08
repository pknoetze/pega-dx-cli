import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: DataDelete } = await import('../../../src/commands/data/delete.js');

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

describe('data delete', () => {
  test('DELETEs /data/{dataViewId}', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .delete('/prweb/api/application/v2/data/D_MyView')
      .reply(200, { deleted: true });

    captured = captureOutput();
    await DataDelete.run(['D_MyView']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ deleted: true });
  });

  test('URL-encodes the dataViewId', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const id = 'D_My View';
    const encoded = encodeURIComponent(id);
    expect(encoded).toContain('%20');
    const scope = nock('https://pega.example.com')
      .delete(`/prweb/api/application/v2/data/${encoded}`)
      .reply(200, { deleted: true });

    captured = captureOutput();
    await DataDelete.run([id]);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run emits DELETE method with correct URL and no network call', async () => {
    captured = captureOutput();
    await DataDelete.run(['D_MyView', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('DELETE');
    expect(out.url).toBe(
      'https://pega.example.com/prweb/api/application/v2/data/D_MyView',
    );
  });
});
