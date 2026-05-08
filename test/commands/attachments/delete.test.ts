import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: AttachmentsDelete } = await import('../../../src/commands/attachments/delete.js');

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

describe('attachments delete', () => {
  test('DELETEs /attachments/{id}', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .delete('/prweb/api/application/v2/attachments/ATTACH-ID-1')
      .reply(200, {});

    captured = captureOutput();
    await AttachmentsDelete.run(['ATTACH-ID-1']);
    expect(scope.isDone()).toBe(true);
  });

  test('URL-encodes the id', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const idWithSpace = 'MYAPP attach 123';
    const encodedId = encodeURIComponent(idWithSpace);
    expect(encodedId).toContain('%20');
    const scope = nock('https://pega.example.com')
      .delete(`/prweb/api/application/v2/attachments/${encodedId}`)
      .reply(200, {});

    captured = captureOutput();
    await AttachmentsDelete.run([idWithSpace]);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run emits DELETE method with correct URL and no network call', async () => {
    captured = captureOutput();
    await AttachmentsDelete.run(['ATTACH-ID-1', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('DELETE');
    expect(out.url).toBe(
      'https://pega.example.com/prweb/api/application/v2/attachments/ATTACH-ID-1',
    );
  });
});
