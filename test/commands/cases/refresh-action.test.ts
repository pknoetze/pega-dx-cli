import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import CasesRefreshAction from '../../../src/commands/cases/refresh-action.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import { captureOutput } from '../../helpers/capture-output.js';

let origEmitWarning: typeof process.emitWarning;

describe('cases refresh-action', () => {
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

  test('PATCHes /cases/{id}/actions/{action}/refresh (encoding included)', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    const id = 'CASE WITH SPACE';
    const encoded = encodeURIComponent(id);
    nock('https://pega.example.com')
      .get(`/prweb/api/application/v2/cases/${encoded}`)
      .reply(200, { id }, { ETag: '"e1"' });
    const scope = nock('https://pega.example.com')
      .patch(
        `/prweb/api/application/v2/cases/${encoded}/actions/Approve/refresh`,
        { content: { x: 1 } },
      )
      .matchHeader('If-Match', '"e1"')
      .reply(200, { refreshed: true });
    const captured = captureOutput();
    try {
      await CasesRefreshAction.run([id, '--action', 'Approve', '--data', '{"x":1}']);
      expect(scope.isDone()).toBe(true);
    } finally {
      captured.restore();
    }
  });
});
