import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: DataCreate } = await import('../../../src/commands/data/create.js');

let captured: CapturedOutput;
let origEmitWarning: typeof process.emitWarning;

beforeEach(() => {
  resetMockFs();
  process.env.HOME = '/home/test';
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
  captured?.restore();
  process.emitWarning = origEmitWarning;
  delete process.env.PEGA_BASE_URL;
  delete process.env.PEGA_CLIENT_ID;
  delete process.env.PEGA_CLIENT_SECRET;
  delete process.env.PEGA_NO_CACHE;
});

describe('data create', () => {
  test('POSTs to /data/{dataViewId} with body wrapped in {data:{...}}', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .post('/prweb/api/application/v2/data/D_MyView', { data: { field: 'value' } })
      .reply(201, { id: 'new-record' });

    captured = captureOutput();
    await DataCreate.run(['D_MyView', '--data', '{"field":"value"}']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ id: 'new-record' });
  });

  test('URL-encodes the dataViewId', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const id = 'D_My View';
    const encoded = encodeURIComponent(id);
    expect(encoded).toContain('%20');
    const scope = nock('https://pega.example.com')
      .post(`/prweb/api/application/v2/data/${encoded}`, { data: { field: 'value' } })
      .reply(201, { id: 'enc-record' });

    captured = captureOutput();
    await DataCreate.run([id, '--data', '{"field":"value"}']);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run emits POST method with correct URL and no network call', async () => {
    captured = captureOutput();
    await DataCreate.run(['D_MyView', '--data', '{"field":"value"}', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('POST');
    expect(out.url).toBe(
      'https://pega.example.com/prweb/api/application/v2/data/D_MyView',
    );
  });

  test('invalid --data JSON exits with INVALID_ARGS', async () => {
    captured = captureOutput();
    await expect(DataCreate.run(['D_MyView', '--data', '{bad'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err.code).toBe('INVALID_ARGS');
  });
});
