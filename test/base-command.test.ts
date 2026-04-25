import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs } from './helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from './helpers/capture-output.js';
import { mockOAuthSuccess } from './helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});
jest.unstable_mockModule('node:fs/promises', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs.promises, default: memfs.fs.promises };
});

const { BaseCommand } = await import('../src/base-command.js');

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
  // Jest's VM module sandbox causes oclif's CLIError to fail Node's native emitWarning
  // validation (ERR_INVALID_ARG_TYPE) even though `instanceof Error` is true in JS.
  // Patch emitWarning to always coerce warnings to strings to avoid the native check.
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

describe('BaseCommand.baseFlags', () => {
  test('declares all 7 global flags', () => {
    const flags = BaseCommand.baseFlags as Record<string, unknown>;
    for (const name of ['format', 'fields', 'dry-run', 'quiet', 'verbose', 'no-cache', 'profile']) {
      expect(flags[name]).toBeDefined();
    }
  });
});

class TestCmd extends BaseCommand {
  static override description = 'test command';
  async run(): Promise<void> {
    const { flags } = await this.parse(TestCmd);
    const client = await this.getClient(flags);
    const data = await client.get<{ id: string }>('/cases/C-1');
    this.emit(data, flags);
  }
}

describe('getClient + emit', () => {
  test('getClient wires a working PegaApiClient', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/C-1')
      .reply(200, { id: 'C-1' });

    captured = captureOutput();
    await TestCmd.run([]);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ id: 'C-1' });
  });

  test('emit respects --fields', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/C-1')
      .reply(200, { id: 'C-1', extra: 'drop', keep: 'me' });

    captured = captureOutput();
    await TestCmd.run(['--fields', 'id,keep']);
    const parsed = JSON.parse(captured.stdout.join(''));
    expect(parsed).toEqual({ id: 'C-1', keep: 'me' });
  });
});
