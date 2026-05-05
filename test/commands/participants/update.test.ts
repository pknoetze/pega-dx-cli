import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import ParticipantsUpdate from '../../../src/commands/participants/update.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import { captureOutput } from '../../helpers/capture-output.js';

let origEmitWarning: typeof process.emitWarning;

describe('participants update', () => {
  beforeEach(() => {
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
    process.emitWarning = origEmitWarning;
    delete process.env.PEGA_BASE_URL;
    delete process.env.PEGA_CLIENT_ID;
    delete process.env.PEGA_CLIENT_SECRET;
    delete process.env.PEGA_NO_CACHE;
  });

  test('PATCHes /cases/{id}/participants/{participantID} with eTag', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    const id = 'PEGA PART X';
    const encoded = encodeURIComponent(id);
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/MYAPP-CASE-1')
      .reply(200, { id: 'MYAPP-CASE-1' }, { ETag: '"e1"' });
    const scope = nock('https://pega.example.com', {
      reqheaders: { 'if-match': '"e1"' },
    })
      .patch(
        `/prweb/api/application/v2/cases/MYAPP-CASE-1/participants/${encoded}`,
        { content: { email: 'a@b.com' } },
      )
      .reply(200, { updated: true });
    const captured = captureOutput();
    try {
      await ParticipantsUpdate.run([
        'MYAPP-CASE-1',
        '--participant-id',
        id,
        '--data',
        '{"email":"a@b.com"}',
      ]);
      expect(scope.isDone()).toBe(true);
      expect(JSON.parse(captured.stdout.join(''))).toEqual({ updated: true });
    } finally {
      captured.restore();
    }
  });

  test('rejects --role flag (renamed in 0.4.0)', async () => {
    let caughtError: { oclif?: { exit?: number } } | undefined;
    try {
      await ParticipantsUpdate.run(['MYAPP-CASE-1', '--role', 'Owner']);
    } catch (e) {
      caughtError = e as { oclif?: { exit?: number } };
    }
    expect(caughtError?.oclif?.exit).toBe(2);
  });
});
