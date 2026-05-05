import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import ParticipantsDelete from '../../../src/commands/participants/delete.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import { captureOutput } from '../../helpers/capture-output.js';

let origEmitWarning: typeof process.emitWarning;

describe('participants delete', () => {
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

  test('DELETEs /cases/{id}/participants/{participantID}', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .delete('/prweb/api/application/v2/cases/MYAPP-CASE-1/participants/PEGA-PART-X')
      .reply(200, { deleted: true });
    const captured = captureOutput();
    try {
      await ParticipantsDelete.run(['MYAPP-CASE-1', '--participant-id', 'PEGA-PART-X']);
      expect(scope.isDone()).toBe(true);
      expect(JSON.parse(captured.stdout.join(''))).toEqual({ deleted: true });
    } finally {
      captured.restore();
    }
  });

  test('encoding: participant ID with space → URL-encoded', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const id = 'PEGA PART X';
    const encoded = encodeURIComponent(id);
    const scope = nock('https://pega.example.com')
      .delete(`/prweb/api/application/v2/cases/MYAPP-CASE-1/participants/${encoded}`)
      .reply(200, { deleted: true });
    const captured = captureOutput();
    try {
      await ParticipantsDelete.run(['MYAPP-CASE-1', '--participant-id', id]);
      expect(scope.isDone()).toBe(true);
    } finally {
      captured.restore();
    }
  });

  test('rejects --role flag (renamed in 0.4.0)', async () => {
    let caughtError: { oclif?: { exit?: number } } | undefined;
    try {
      await ParticipantsDelete.run(['MYAPP-CASE-1', '--role', 'Owner']);
    } catch (e) {
      caughtError = e as { oclif?: { exit?: number } };
    }
    expect(caughtError?.oclif?.exit).toBe(2);
  });
});
