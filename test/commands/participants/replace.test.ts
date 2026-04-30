import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: ParticipantsReplace } = await import('../../../src/commands/participants/replace.js');

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
    const msg = typeof warning === 'string'
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

describe('participants replace', () => {
  test('GETs case for eTag, then PUTs /cases/{id}/participants/{role} with body array', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/MYAPP-CASE-1')
      .reply(200, { id: 'MYAPP-CASE-1' }, { ETag: '"e1"' });
    nock('https://pega.example.com')
      .matchHeader('If-Match', '"e1"')
      .put(
        '/prweb/api/application/v2/cases/MYAPP-CASE-1/participants/Reviewer',
        [{ user: 'U1' }, { user: 'U2' }],
      )
      .reply(200, { replaced: true });

    captured = captureOutput();
    await ParticipantsReplace.run([
      'MYAPP-CASE-1',
      '--role', 'Reviewer',
      '--data', '[{"user":"U1"},{"user":"U2"}]',
    ]);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ replaced: true });
  });
});
