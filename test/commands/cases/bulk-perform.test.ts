import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import CasesBulkPerform from '../../../src/commands/cases/bulk-perform.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import { captureOutput } from '../../helpers/capture-output.js';

let origEmitWarning: typeof process.emitWarning;

describe('cases bulk-perform', () => {
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

  test('Infinity 207 all-success: exit 0, emit array', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/cases?actionID=Approve', {
        cases: [{ ID: 'CASE-1' }, { ID: 'CASE-2' }],
        content: { reason: 'OK' },
      })
      .reply(207, [
        { ID: 'CASE-1', status: 200 },
        { ID: 'CASE-2', status: 200 },
      ]);
    const captured = captureOutput();
    try {
      await CasesBulkPerform.run([
        '--action',
        'Approve',
        '--cases',
        'CASE-1,CASE-2',
        '--data',
        '{"reason":"OK"}',
      ]);
      expect(scope.isDone()).toBe(true);
      const out = JSON.parse(captured.stdout.join(''));
      expect(out).toHaveLength(2);
    } finally {
      captured.restore();
    }
  });

  test('Infinity 207 partial-failure: exit 1, emit array', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/cases?actionID=Approve')
      .reply(207, [
        { ID: 'CASE-1', status: 200 },
        { ID: 'CASE-2', status: 400, error: 'validation_failed' },
      ]);
    const captured = captureOutput();
    let caughtError: { oclif?: { exit?: number } } | undefined;
    try {
      await CasesBulkPerform.run([
        '--action',
        'Approve',
        '--cases',
        'CASE-1,CASE-2',
      ]).catch((e) => {
        caughtError = e as { oclif?: { exit?: number } };
      });
      expect(scope.isDone()).toBe(true);
      // Array still emitted to stdout before failure
      const out = JSON.parse(captured.stdout.join(''));
      expect(out).toHaveLength(2);
      // fail() exits with code 1 via this.exit, which throws an ExitError
      expect(caughtError?.oclif?.exit).toBe(1);
      // Stderr contains the BULK_PARTIAL_FAILURE error code
      expect(captured.stderr.join('')).toContain('BULK_PARTIAL_FAILURE');
    } finally {
      captured.restore();
    }
  });

  test('Launchpad 202 async: exit 0, emit jobID', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/cases?actionID=Approve&runningMode=async')
      .reply(202, { jobID: 'JOB-1' });
    const captured = captureOutput();
    try {
      await CasesBulkPerform.run([
        '--action',
        'Approve',
        '--cases',
        'CASE-1',
        '--running-mode',
        'async',
      ]);
      expect(scope.isDone()).toBe(true);
      const out = JSON.parse(captured.stdout.join(''));
      expect(out).toEqual({ jobID: 'JOB-1' });
    } finally {
      captured.restore();
    }
  });

  test('action ID with space → URL-encoded query value', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const action = 'Approve With Reason';
    const encoded = encodeURIComponent(action);
    const scope = nock('https://pega.example.com')
      .patch(`/prweb/api/application/v2/cases?actionID=${encoded}`, {
        cases: [{ ID: 'CASE-1' }],
      })
      .reply(207, [{ ID: 'CASE-1', status: 200 }]);
    const captured = captureOutput();
    try {
      await CasesBulkPerform.run(['--action', action, '--cases', 'CASE-1']);
      expect(scope.isDone()).toBe(true);
    } finally {
      captured.restore();
    }
  });

  test('--dry-run shows PATCH + URL with query + body', async () => {
    const captured = captureOutput();
    try {
      await CasesBulkPerform.run([
        '--action',
        'Approve',
        '--cases',
        'CASE-1,CASE-2',
        '--dry-run',
      ]);
      const out = JSON.parse(captured.stdout.join(''));
      expect(out.method).toBe('PATCH');
      expect(out.url).toBe(
        'https://pega.example.com/prweb/api/application/v2/cases?actionID=Approve',
      );
      expect(out.body.cases).toEqual([{ ID: 'CASE-1' }, { ID: 'CASE-2' }]);
      // No If-Match header for bulk endpoint (PDF p.329)
      expect(out.headers['If-Match']).toBeUndefined();
      expect(out.headers['Content-Type']).toBe('application/json');
    } finally {
      captured.restore();
    }
  });
});
