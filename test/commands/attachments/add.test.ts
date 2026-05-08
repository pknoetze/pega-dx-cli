import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: AttachmentsAdd } = await import('../../../src/commands/attachments/add.js');

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

describe('attachments add', () => {
  test('POSTs {attachments:[...]} to /cases/{caseId}/attachments', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const attachmentArray = [{ type: 'File', category: 'Correspondence', name: 'doc.pdf', ID: 'att-1' }];
    const scope = nock('https://pega.example.com')
      .post('/prweb/api/application/v2/cases/MYAPP-CASE-1/attachments', {
        attachments: attachmentArray,
      })
      .reply(200, { attachments: attachmentArray });

    captured = captureOutput();
    await AttachmentsAdd.run(['MYAPP-CASE-1', '--attachments', JSON.stringify(attachmentArray)]);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ attachments: attachmentArray });
  });

  test('URL-encodes the caseId', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const caseIdWithSpace = 'MYAPP CASE 1';
    const encodedCaseId = encodeURIComponent(caseIdWithSpace);
    expect(encodedCaseId).toContain('%20');
    const attachmentArray = [{ type: 'File', name: 'f.pdf', ID: 'x' }];
    const scope = nock('https://pega.example.com')
      .post(`/prweb/api/application/v2/cases/${encodedCaseId}/attachments`, {
        attachments: attachmentArray,
      })
      .reply(200, {});

    captured = captureOutput();
    await AttachmentsAdd.run([caseIdWithSpace, '--attachments', JSON.stringify(attachmentArray)]);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run emits POST method with correct URL and no network call', async () => {
    captured = captureOutput();
    await AttachmentsAdd.run(['MYAPP-CASE-1', '--attachments', '[]', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('POST');
    expect(out.url).toBe(
      'https://pega.example.com/prweb/api/application/v2/cases/MYAPP-CASE-1/attachments',
    );
  });
});
