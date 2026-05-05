import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import ParticipantsGet from '../../../src/commands/participants/get.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import { captureOutput } from '../../helpers/capture-output.js';

let origEmitWarning: typeof process.emitWarning;

describe('participants get', () => {
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

  test('happy path: GET /cases/{id}/participants/{participantID}', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/MYAPP-CASE-1/participants/PEGA-PART-X')
      .reply(200, { ID: 'PEGA-PART-X', role: 'Owner' });

    const captured = captureOutput();
    try {
      await ParticipantsGet.run(['MYAPP-CASE-1', '--participant-id', 'PEGA-PART-X']);
      expect(JSON.parse(captured.stdout.join(''))).toEqual({
        ID: 'PEGA-PART-X',
        role: 'Owner',
      });
    } finally {
      captured.restore();
    }
  });

  test('encoding: participant ID with space → URL-encoded', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const id = 'PEGA PART X';
    const encoded = encodeURIComponent(id);
    const scope = nock('https://pega.example.com')
      .get(`/prweb/api/application/v2/cases/MYAPP-CASE-1/participants/${encoded}`)
      .reply(200, { ID: id });
    const captured = captureOutput();
    try {
      await ParticipantsGet.run(['MYAPP-CASE-1', '--participant-id', id]);
      expect(scope.isDone()).toBe(true);
    } finally {
      captured.restore();
    }
  });

  test('rejects --role flag (renamed in 0.4.0)', async () => {
    let caughtError: { oclif?: { exit?: number } } | undefined;
    try {
      await ParticipantsGet.run(['MYAPP-CASE-1', '--role', 'Owner']);
    } catch (e) {
      caughtError = e as { oclif?: { exit?: number } };
    }
    expect(caughtError?.oclif?.exit).toBe(2);
  });

  test('--dry-run shows GET method', async () => {
    const captured = captureOutput();
    try {
      await ParticipantsGet.run([
        'MYAPP-CASE-1',
        '--participant-id',
        'PEGA-PART-X',
        '--dry-run',
      ]);
      const out = JSON.parse(captured.stdout.join(''));
      expect(out.method).toBe('GET');
      expect(out.url).toBe(
        'https://pega.example.com/prweb/api/application/v2/cases/MYAPP-CASE-1/participants/PEGA-PART-X',
      );
    } finally {
      captured.restore();
    }
  });
});
