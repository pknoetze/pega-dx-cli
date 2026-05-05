import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import CaseTypesListBulkActions from '../../../src/commands/case-types/list-bulk-actions.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import { captureOutput } from '../../helpers/capture-output.js';

let origEmitWarning: typeof process.emitWarning;

describe('case-types list-bulk-actions', () => {
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

  test('GETs /casetypes/{id}/bulk-actions (encoding included)', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const id = 'CT WITH SPACE';
    const encoded = encodeURIComponent(id);
    const scope = nock('https://pega.example.com')
      .get(`/prweb/api/application/v2/casetypes/${encoded}/bulk-actions`)
      .reply(200, { availableActions: [] });
    const captured = captureOutput();
    try {
      await CaseTypesListBulkActions.run([id]);
      expect(scope.isDone()).toBe(true);
    } finally {
      captured.restore();
    }
  });
});
