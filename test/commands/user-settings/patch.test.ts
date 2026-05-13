import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs, seedFile } from '../../helpers/mock-filesystem.js';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: UserSettingsPatch } = await import('../../../src/commands/user-settings/patch.js');

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

describe('user-settings patch', () => {
  test('PATCHes /user_settings with inline JSON body', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/user_settings', { patchPreference: 'someValue' })
      .reply(200, { updated: true });

    captured = captureOutput();
    await UserSettingsPatch.run(['--data', '{"patchPreference":"someValue"}']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ updated: true });
  });

  test('--data @file reads from memfs and PATCHes', async () => {
    seedFile('/tmp/settings.json', '{"theme":"dark"}');
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/user_settings', { theme: 'dark' })
      .reply(200, { updated: true });

    captured = captureOutput();
    await UserSettingsPatch.run(['--data', '@/tmp/settings.json']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ updated: true });
  });

  test('--data - reads from stdin and PATCHes', async () => {
    const stdinData = '{"fromStdin":true}';
    const { Readable } = await import('node:stream');
    const origStdin = process.stdin;
    const mockStdin = Readable.from([stdinData]);
    Object.defineProperty(process, 'stdin', { value: mockStdin, configurable: true });

    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/user_settings', { fromStdin: true })
      .reply(200, { updated: true });

    captured = captureOutput();
    try {
      await UserSettingsPatch.run(['--data', '-']);
      expect(scope.isDone()).toBe(true);
      expect(JSON.parse(captured.stdout.join(''))).toEqual({ updated: true });
    } finally {
      Object.defineProperty(process, 'stdin', { value: origStdin, configurable: true });
    }
  });

  test('--dry-run emits PATCH with body and no network call', async () => {
    captured = captureOutput();
    await UserSettingsPatch.run(['--data', '{"patchPreference":"someValue"}', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('PATCH');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/user_settings');
    expect(out.body).toEqual({ patchPreference: 'someValue' });
  });

  test('invalid JSON in --data exits with INVALID_ARGS', async () => {
    captured = captureOutput();
    await expect(UserSettingsPatch.run(['--data', '{bad'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err.code).toBe('INVALID_ARGS');
  });

  test('400 structured error is reported correctly', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/user_settings')
      .reply(400, { localizedValue: 'Bad request', errorDetails: [{ message: 'Invalid field' }] });

    captured = captureOutput();
    await expect(UserSettingsPatch.run(['--data', '{"bad":"field"}'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, httpStatus: 400 });
  });
});
