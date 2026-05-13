import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import RecentsUpdate from '../../../src/commands/recents/update.js';

let captured: CapturedOutput;
let origEmitWarning: typeof process.emitWarning;

beforeEach(() => {
  process.env.PEGA_BASE_URL = 'https://pega.example.com';
  process.env.PEGA_CLIENT_ID = 'cid';
  process.env.PEGA_CLIENT_SECRET = 'sec';
  process.env.PEGA_NO_CACHE = 'true';
  if (!nock.isActive()) nock.activate();
  origEmitWarning = process.emitWarning;
  process.emitWarning = (warning: string | Error, ...args: unknown[]) => {
    const msg = typeof warning === 'string' ? warning : ((warning as { message?: string }).message ?? String(warning));
    origEmitWarning.call(process, msg, ...(args as []));
  };
});

afterEach(() => {
  cleanupNock();
  captured?.restore();
  process.emitWarning = origEmitWarning;
  delete process.env.PEGA_BASE_URL;
  delete process.env.PEGA_CLIENT_ID;
  delete process.env.PEGA_CLIENT_SECRET;
  delete process.env.PEGA_NO_CACHE;
});

describe('recents update', () => {
  test('happy path: PATCH /recents with {pyLabel, pyID}', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/recents', { pyLabel: 'My Case', pyID: 'M-1' })
      .reply(200, undefined);
    captured = captureOutput();
    await RecentsUpdate.run(['--label', 'My Case', '--id', 'M-1']);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run emits PATCH with body', async () => {
    captured = captureOutput();
    await RecentsUpdate.run(['--label', 'X', '--id', 'Y', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('PATCH');
    expect(out.body).toEqual({ pyLabel: 'X', pyID: 'Y' });
  });

  test('missing --label rejects', async () => {
    captured = captureOutput();
    await expect(RecentsUpdate.run(['--id', 'Y'])).rejects.toThrow();
  });

  test('missing --id rejects', async () => {
    captured = captureOutput();
    await expect(RecentsUpdate.run(['--label', 'X'])).rejects.toThrow();
  });

  test('400 emits structured error', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/recents')
      .reply(400, { localizedValue: 'Bad input' });
    captured = captureOutput();
    await expect(RecentsUpdate.run(['--label', 'X', '--id', 'Y'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'BAD_REQUEST', httpStatus: 400 });
  });
});
