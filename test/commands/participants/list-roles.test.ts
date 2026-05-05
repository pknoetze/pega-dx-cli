import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import ParticipantsListRoles from '../../../src/commands/participants/list-roles.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import { captureOutput } from '../../helpers/capture-output.js';

let origEmitWarning: typeof process.emitWarning;

describe('participants list-roles', () => {
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

  test('GETs /cases/{id}/participant_roles (encoding included)', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const id = 'CASE WITH SPACE';
    const encoded = encodeURIComponent(id);
    const scope = nock('https://pega.example.com')
      .get(`/prweb/api/application/v2/cases/${encoded}/participant_roles`)
      .reply(200, { roles: [] });
    const captured = captureOutput();
    try {
      await ParticipantsListRoles.run([id]);
      expect(scope.isDone()).toBe(true);
    } finally {
      captured.restore();
    }
  });
});
