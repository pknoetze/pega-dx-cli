import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import CasesPerformAction from '../../../src/commands/cases/perform-action.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import { captureOutput } from '../../helpers/capture-output.js';

let origEmitWarning: typeof process.emitWarning;

describe('cases perform-action', () => {
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

  test('--data only → body = {content}', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/MYAPP-CASE-1')
      .reply(200, { id: 'MYAPP-CASE-1' }, { ETag: '"e1"' });
    nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/cases/MYAPP-CASE-1/actions/Approve', {
        content: { reason: 'OK' },
      })
      .matchHeader('If-Match', '"e1"')
      .reply(200, { ok: true });
    const captured = captureOutput();
    try {
      await CasesPerformAction.run([
        'MYAPP-CASE-1',
        '--action',
        'Approve',
        '--data',
        '{"reason":"OK"}',
      ]);
      expect(JSON.parse(captured.stdout.join(''))).toEqual({ ok: true });
    } finally {
      captured.restore();
    }
  });

  test('all three flags → body = {content, pageInstructions, attachments}', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/MYAPP-CASE-1')
      .reply(200, { id: 'MYAPP-CASE-1' }, { ETag: '"e1"' });
    const scope = nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/cases/MYAPP-CASE-1/actions/Approve', {
        content: { reason: 'OK' },
        pageInstructions: [{ i: 'add' }],
        attachments: [{ type: 'File', ID: 'a' }],
      })
      .matchHeader('If-Match', '"e1"')
      .reply(200, { ok: true });
    const captured = captureOutput();
    try {
      await CasesPerformAction.run([
        'MYAPP-CASE-1',
        '--action',
        'Approve',
        '--data',
        '{"reason":"OK"}',
        '--page-instructions',
        '[{"i":"add"}]',
        '--attachments',
        '[{"type":"File","ID":"a"}]',
      ]);
      expect(scope.isDone()).toBe(true);
    } finally {
      captured.restore();
    }
  });

  test('no flags → body = {} (PATCH still sent)', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/MYAPP-CASE-1')
      .reply(200, { id: 'MYAPP-CASE-1' }, { ETag: '"e1"' });
    const scope = nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/cases/MYAPP-CASE-1/actions/Approve', {})
      .matchHeader('If-Match', '"e1"')
      .reply(200, { ok: true });
    const captured = captureOutput();
    try {
      await CasesPerformAction.run(['MYAPP-CASE-1', '--action', 'Approve']);
      expect(scope.isDone()).toBe(true);
    } finally {
      captured.restore();
    }
  });

  test('--dry-run shows PATCH + If-Match + body', async () => {
    const captured = captureOutput();
    try {
      await CasesPerformAction.run([
        'MYAPP-CASE-1',
        '--action',
        'Approve',
        '--data',
        '{"reason":"OK"}',
        '--page-instructions',
        '[]',
        '--dry-run',
      ]);
      const out = JSON.parse(captured.stdout.join(''));
      expect(out.method).toBe('PATCH');
      expect(out.headers['If-Match']).toBe('<etag-from-GET>');
      expect(out.body).toEqual({ content: { reason: 'OK' }, pageInstructions: [] });
    } finally {
      captured.restore();
    }
  });

  test('action ID with space → URL-encoded', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    const action = 'Approve With Reason';
    const encoded = encodeURIComponent(action);
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/MYAPP-CASE-1')
      .reply(200, { id: 'MYAPP-CASE-1' }, { ETag: '"e1"' });
    const scope = nock('https://pega.example.com')
      .patch(
        `/prweb/api/application/v2/cases/MYAPP-CASE-1/actions/${encoded}`,
        {},
      )
      .matchHeader('If-Match', '"e1"')
      .reply(200, { ok: true });
    const captured = captureOutput();
    try {
      await CasesPerformAction.run(['MYAPP-CASE-1', '--action', action]);
      expect(scope.isDone()).toBe(true);
    } finally {
      captured.restore();
    }
  });
});
