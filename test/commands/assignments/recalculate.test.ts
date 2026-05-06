import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import AssignmentsRecalculate from '../../../src/commands/assignments/recalculate.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import { captureOutput } from '../../helpers/capture-output.js';

let origEmitWarning: typeof process.emitWarning;

describe('assignments recalculate', () => {
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

  test('PATCHes /assignments/{id}/actions/{action}/recalculate with calculations body (encoding included)', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    const id = 'ASSIGN WITH SPACE';
    const encoded = encodeURIComponent(id);
    const calcData = { calculations: { fields: [{ name: '.Total', context: 'content' }] } };
    nock('https://pega.example.com')
      .get(`/prweb/api/application/v2/assignments/${encoded}`)
      .reply(200, { id }, { ETag: '"e1"' });
    const scope = nock('https://pega.example.com', {
      reqheaders: { 'if-match': '"e1"' },
    })
      .patch(
        `/prweb/api/application/v2/assignments/${encoded}/actions/Submit/recalculate`,
        calcData,
      )
      .reply(200, { recalculated: true });
    const captured = captureOutput();
    try {
      await AssignmentsRecalculate.run([
        id,
        '--action',
        'Submit',
        '--data',
        JSON.stringify(calcData),
      ]);
      expect(scope.isDone()).toBe(true);
    } finally {
      captured.restore();
    }
  });
});
