import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: AttachmentsPatch } = await import('../../../src/commands/attachments/patch.js');

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

describe('attachments patch', () => {
  test('PATCHes /attachments/{id} with name only', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/attachments/ATTACH-ID-1', { name: 'New Name' })
      .reply(200, { name: 'New Name' });

    captured = captureOutput();
    await AttachmentsPatch.run(['ATTACH-ID-1', '--name', 'New Name']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ name: 'New Name' });
  });

  test('PATCHes /attachments/{id} with category only', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/attachments/ATTACH-ID-1', { category: 'Correspondence' })
      .reply(200, { category: 'Correspondence' });

    captured = captureOutput();
    await AttachmentsPatch.run(['ATTACH-ID-1', '--category', 'Correspondence']);
    expect(scope.isDone()).toBe(true);
  });

  test('PATCHes /attachments/{id} with both name and category', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/attachments/ATTACH-ID-1', {
        name: 'New Name',
        category: 'Correspondence',
      })
      .reply(200, { name: 'New Name', category: 'Correspondence' });

    captured = captureOutput();
    await AttachmentsPatch.run(['ATTACH-ID-1', '--name', 'New Name', '--category', 'Correspondence']);
    expect(scope.isDone()).toBe(true);
  });

  test('URL-encodes the id', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const idWithSpace = 'MYAPP attach 123';
    const encodedId = encodeURIComponent(idWithSpace);
    expect(encodedId).toContain('%20');
    const scope = nock('https://pega.example.com')
      .patch(`/prweb/api/application/v2/attachments/${encodedId}`, { name: 'Test' })
      .reply(200, {});

    captured = captureOutput();
    await AttachmentsPatch.run([idWithSpace, '--name', 'Test']);
    expect(scope.isDone()).toBe(true);
  });

  test('exits with code 2 when neither --name nor --category is provided', async () => {
    captured = captureOutput();
    let caughtError: { oclif?: { exit?: number } } | undefined;
    try {
      await AttachmentsPatch.run(['ATTACH-ID-1']);
    } catch (e) {
      caughtError = e as { oclif?: { exit?: number } };
    }
    expect(caughtError?.oclif?.exit).toBe(2);
  });

  test('--dry-run emits PATCH method with correct URL and no network call', async () => {
    captured = captureOutput();
    await AttachmentsPatch.run(['ATTACH-ID-1', '--name', 'New Name', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('PATCH');
    expect(out.url).toBe(
      'https://pega.example.com/prweb/api/application/v2/attachments/ATTACH-ID-1',
    );
  });
});
