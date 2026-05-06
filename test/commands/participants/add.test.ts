import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: ParticipantsAdd } = await import('../../../src/commands/participants/add.js');

let captured: CapturedOutput;
let origEmitWarning: typeof process.emitWarning;

beforeEach(() => {
  resetMockFs();
  process.env.HOME = '/home/test';
  process.env.PEGA_BASE_URL = 'https://pega.example.com';
  process.env.PEGA_CLIENT_ID = 'id';
  process.env.PEGA_CLIENT_SECRET = 's';
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

describe('participants add', () => {
  test('POSTs {participantRoleID, content} to /cases/{id}/participants with eTag', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    const contentData = { pyFirstName: 'Jane', pyLastName: 'Doe', pyEmail1: 'jane@example.com', pyPhoneNumber: '' };
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/MYAPP-CASE-1')
      .reply(200, {}, { ETag: '"etag1"' });
    const scope = nock('https://pega.example.com')
      .post('/prweb/api/application/v2/cases/MYAPP-CASE-1/participants', {
        participantRoleID: 'Customer',
        content: contentData,
      })
      .matchHeader('If-Match', '"etag1"')
      .reply(201, { participantRoleID: 'Customer' });

    captured = captureOutput();
    await ParticipantsAdd.run([
      'MYAPP-CASE-1',
      '--role',
      'Customer',
      '--data',
      JSON.stringify(contentData),
    ]);
    expect(scope.isDone()).toBe(true);
  });
});
