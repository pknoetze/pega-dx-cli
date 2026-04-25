import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: AssignmentsGet } = await import('../../../src/commands/assignments/get.js');

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

describe('assignments get', () => {
  test('emits assignment JSON on success', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/A-1')
      .reply(200, { id: 'A-1', status: 'Open' });

    captured = captureOutput();
    await AssignmentsGet.run(['A-1']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ id: 'A-1', status: 'Open' });
  });

  test('URL-encodes the assignment ID', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/ASSIGN-WORKLIST%20X-1!FLOW')
      .reply(200, { id: 'x' });

    captured = captureOutput();
    await AssignmentsGet.run(['ASSIGN-WORKLIST X-1!FLOW']);
    expect(JSON.parse(captured.stdout.join('')).id).toBe('x');
  });

  test('--dry-run prints GET request without network', async () => {
    captured = captureOutput();
    await AssignmentsGet.run(['A-1', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toContain('/assignments/A-1');
    expect(out.headers.Authorization).toBe('[REDACTED]');
  });

  test('404 emits structured error and exits 1', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/MISSING')
      .reply(404, { localizedValue: 'Assignment not found' });

    captured = captureOutput();
    await expect(AssignmentsGet.run(['MISSING'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
