import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { Flags } from '@oclif/core';
import { resetMockFs } from './helpers/mock-filesystem.js';
import { captureOutput, parseFirstJson, type CapturedOutput } from './helpers/capture-output.js';
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

describe('catch + fail', () => {
  test('runtime error from run() emits structured error to stderr and exits non-zero', async () => {
    // Use TestCmd with a deliberately broken setup: missing PEGA_BASE_URL.
    delete process.env.PEGA_BASE_URL;

    captured = captureOutput();
    await expect(TestCmd.run([])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr);
    expect(err).toMatchObject({
      error: true,
      code: 'INVALID_CONFIG',
    });
  });

  test('plain Error (no NormalizedError shape) is coerced to UNKNOWN', async () => {
    class ThrowingCmd extends BaseCommand {
      static override description = 'throws plain';
      async run(): Promise<void> {
        throw new Error('boom');
      }
    }
    captured = captureOutput();
    await expect(ThrowingCmd.run([])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr);
    expect(err).toMatchObject({ error: true, code: 'UNKNOWN', message: 'boom' });
  });

  test('NormalizedError thrown in run() is emitted via fail without coercion', async () => {
    class CustomErrorCmd extends BaseCommand {
      static override description = 'throws normalized';
      async run(): Promise<void> {
        const obj = { code: 'CUSTOM', message: 'custom err', httpStatus: 0 };
        throw obj as unknown as Error;
      }
    }
    captured = captureOutput();
    await expect(CustomErrorCmd.run([])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr);
    expect(err).toMatchObject({ error: true, code: 'CUSTOM', message: 'custom err' });
  });

  test('oclif parse error is re-thrown (not handled by fail)', async () => {
    class FlaggedCmd extends BaseCommand {
      static override description = 'requires flag';
      static override flags = {
        required: Flags.string({ required: true }),
      };
      async run(): Promise<void> {
        // parse() triggers the required-flag check; the parse error propagates before run body executes
        await this.parse(FlaggedCmd);
      }
    }
    captured = captureOutput();
    // Running without --required should produce an oclif parse error, NOT pass through fail()
    await expect(FlaggedCmd.run([])).rejects.toThrow();
    // Our structured error always has `"error": true`; oclif's handler does not emit that shape
    expect(captured.stderr.join('')).not.toMatch(/"error"\s*:\s*true/);
  });

  test('emitDryRun delegates to output.dryRun (writes redacted request to stdout)', async () => {
    class DryRunCmd extends BaseCommand {
      static override description = 'emits dry run';
      async run(): Promise<void> {
        this.emitDryRun({
          method: 'GET',
          url: 'https://x/path',
          headers: { Authorization: 'Bearer secret' },
        });
      }
    }
    captured = captureOutput();
    await DryRunCmd.run([]);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.headers.Authorization).toBe('[REDACTED]');
    expect(out.url).toBe('https://x/path');
  });

  test('fail handles error without a message field', async () => {
    class NoMsgCmd extends BaseCommand {
      static override description = 'throws no message';
      async run(): Promise<void> {
        throw new Error();
      }
    }
    captured = captureOutput();
    await expect(NoMsgCmd.run([])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err.code).toBe('UNKNOWN');
    expect(err.message).toBe('Unknown error');
  });
});
