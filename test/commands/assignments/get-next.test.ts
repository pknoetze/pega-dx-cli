import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: AssignmentsGetNext } = await import(
  '../../../src/commands/assignments/get-next.js'
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

describe('assignments get-next', () => {
  test('emits assignment JSON on success', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/next')
      .reply(200, { id: 'A-42' });

    captured = captureOutput();
    await AssignmentsGetNext.run([]);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ id: 'A-42' });
  });

  test('emits { assignment: null } on 404 and exits 0', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/next')
      .reply(404, { localizedValue: 'No assignments' });

    captured = captureOutput();
    await AssignmentsGetNext.run([]);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ assignment: null });
  });

  test('--dry-run prints GET /assignments/next without network', async () => {
    captured = captureOutput();
    await AssignmentsGetNext.run(['--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toContain('/assignments/next');
    expect(out.headers.Authorization).toBe('[REDACTED]');
  });
});
