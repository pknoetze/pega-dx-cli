import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: AttachmentsList } = await import('../../../src/commands/attachments/list.js');

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

describe('attachments list', () => {
  test('GETs /cases/{caseId}/attachments', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/MYAPP-CASE-1/attachments')
      .reply(200, { attachments: [] });

    captured = captureOutput();
    await AttachmentsList.run(['MYAPP-CASE-1']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ attachments: [] });
  });

  test('--include-thumbnails appends ?includeThumbnails=true', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/MYAPP-CASE-1/attachments?includeThumbnails=true')
      .reply(200, { attachments: [{ id: 'A1' }] });

    captured = captureOutput();
    await AttachmentsList.run(['MYAPP-CASE-1', '--include-thumbnails']);
    expect(scope.isDone()).toBe(true);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.attachments).toHaveLength(1);
  });

  test('URL-encodes the caseId', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const caseIdWithSpace = 'MYAPP CASE 1';
    const encodedCaseId = encodeURIComponent(caseIdWithSpace);
    // Verify the encoding contains %20 for the space characters
    expect(encodedCaseId).toContain('%20');
    const scope = nock('https://pega.example.com')
      .get(`/prweb/api/application/v2/cases/${encodedCaseId}/attachments`)
      .reply(200, { attachments: [] });

    captured = captureOutput();
    await AttachmentsList.run([caseIdWithSpace]);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run emits GET method with correct URL and no network call', async () => {
    captured = captureOutput();
    await AttachmentsList.run(['MYAPP-CASE-1', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toBe(
      'https://pega.example.com/prweb/api/application/v2/cases/MYAPP-CASE-1/attachments',
    );
  });
});
