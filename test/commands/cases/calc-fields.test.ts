import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import CasesCalcFields from '../../../src/commands/cases/calc-fields.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import { captureOutput } from '../../helpers/capture-output.js';

let origEmitWarning: typeof process.emitWarning;

describe('cases calc-fields', () => {
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

  test('POSTs /cases/{id}/views/{view}/calculated_fields (encoding included)', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const id = 'CASE WITH SPACE';
    const encoded = encodeURIComponent(id);
    const body = { calculations: { fields: [{ name: '.X', context: 'content' }] } };
    const scope = nock('https://pega.example.com')
      .post(
        `/prweb/api/application/v2/cases/${encoded}/views/Summary/calculated_fields`,
        body,
      )
      .reply(200, { values: {} });
    const captured = captureOutput();
    try {
      await CasesCalcFields.run([
        id,
        '--view',
        'Summary',
        '--data',
        JSON.stringify(body),
      ]);
      expect(scope.isDone()).toBe(true);
    } finally {
      captured.restore();
    }
  });
});
