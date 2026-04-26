import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: AssignmentsPerform } = await import(
  '../../../src/commands/assignments/perform.js'
);

let captured: CapturedOutput;
let origEmitWarning: typeof process.emitWarning;

beforeEach(() => {
  resetMockFs();
  process.env.HOME = '/home/test';
  process.env.PEGA_BASE_URL = 'https://pega.example.com';
  process.env.PEGA_CLIENT_ID = 'id';
  process.env.PEGA_CLIENT_SECRET = 's';
  process.env.PEGA_NO_CACHE = 'true';
  if (!nock.isActive()) nock.activate();
  origEmitWarning = process.emitWarning;
  process.emitWarning = (warning: string | Error, ...args: unknown[]) => {
    const msg = typeof warning === 'string'
      ? warning
      : ((warning as { message?: string }).message ?? String(warning));
    origEmitWarning.call(process, msg, ...(args as []));
  };
});

afterEach(() => {
  nock.cleanAll();
  captured?.restore();
  process.emitWarning = origEmitWarning;
});

describe('assignments perform', () => {
  test('GETs assignment first for eTag, then PATCHes with If-Match', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/A-1')
      .reply(200, { id: 'A-1' }, { ETag: '"etag-xyz"' });
    nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/assignments/A-1/actions/Submit', {
        content: { field: 'value' },
      })
      .matchHeader('If-Match', '"etag-xyz"')
      .reply(200, { ok: true });

    captured = captureOutput();
    await AssignmentsPerform.run(['A-1', '--action', 'Submit', '--data', '{"field":"value"}']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ ok: true });
  });

  test('--dry-run prints PATCH request without any network calls', async () => {
    captured = captureOutput();
    await AssignmentsPerform.run([
      'A-1',
      '--action',
      'Submit',
      '--data',
      '{"k":"v"}',
      '--dry-run',
    ]);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('PATCH');
    expect(out.url).toBe(
      'https://pega.example.com/prweb/api/application/v2/assignments/A-1/actions/Submit',
    );
    expect(out.body).toEqual({ content: { k: 'v' } });
  });

  test('no --data sends empty body', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/A-1')
      .reply(200, { id: 'A-1' }, { ETag: '"tag"' });
    nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/assignments/A-1/actions/Submit', {})
      .reply(200, { ok: true });

    captured = captureOutput();
    await AssignmentsPerform.run(['A-1', '--action', 'Submit']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ ok: true });
  });

  test('404 on assignment GET emits structured error and exits 1', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/MISSING')
      .reply(404, { localizedValue: 'Assignment not found' });

    captured = captureOutput();
    await expect(AssignmentsPerform.run(['MISSING', '--action', 'Submit'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });

  test('GET response without ETag emits MISSING_ETAG error and exits 1', async () => {
    mockOAuthSuccess('https://pega.example.com');
    // GET returns 200 but does NOT set an ETag header.
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/A-NO-ETAG')
      .reply(200, { id: 'A-NO-ETAG' }); // no headers arg → no ETag

    captured = captureOutput();
    await expect(
      AssignmentsPerform.run(['A-NO-ETAG', '--action', 'Submit']),
    ).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({
      error: true,
      code: 'MISSING_ETAG',
      httpStatus: 200,
    });
  });

  test('URL-encodes assignment ID and action ID', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/ASSIGN-WORKLIST%20X-1!FLOW')
      .reply(200, { id: 'A-1' }, { ETag: '"tag"' });
    nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/assignments/ASSIGN-WORKLIST%20X-1!FLOW/actions/My%20Action', {})
      .reply(200, { ok: true });

    captured = captureOutput();
    await AssignmentsPerform.run(['ASSIGN-WORKLIST X-1!FLOW', '--action', 'My Action']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ ok: true });
  });
});
