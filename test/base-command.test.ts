import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { Flags } from '@oclif/core';
import { resetMockFs } from './helpers/mock-filesystem.js';
import { captureOutput, parseFirstJson, type CapturedOutput } from './helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from './helpers/mock-pega-api.js';
import type { BaseFlags } from '../src/base-command.js';

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

// Helper: construct a TestCmd instance, spy on exit, call fail() directly, and return the captured exit code.
function callFailWith(code: string): number {
  const cmd = new (class extends BaseCommand {
    static override id = 'test-exit';
    async run(): Promise<void> { /* no-op */ }
  })([], {} as never);

  let captured: number | undefined;
  jest
    .spyOn(cmd as unknown as { exit: (c: number) => void }, 'exit')
    .mockImplementation((c: number) => {
      captured = c;
      throw new Error(`__exit__:${c}`);
    });

  try {
    (cmd as unknown as { fail: (e: unknown) => void }).fail({
      code,
      message: 'test',
      httpStatus: 0,
    });
  } catch {
    /* fail() throws via the exit spy */
  }
  return captured!;
}

describe('BaseCommand.fail() exit codes', () => {
  test('INVALID_CONFIG → exit 2', () => {
    expect(callFailWith('INVALID_CONFIG')).toBe(2);
  });
  test('INVALID_ARGS → exit 2', () => {
    expect(callFailWith('INVALID_ARGS')).toBe(2);
  });
  test('NOT_FOUND → exit 1', () => {
    expect(callFailWith('NOT_FOUND')).toBe(1);
  });
  test('TIMEOUT → exit 1', () => {
    expect(callFailWith('TIMEOUT')).toBe(1);
  });
});

class TestRunGet extends BaseCommand {
  static override id = 'test-run-get';
  async run(): Promise<void> {
    const { flags } = await this.parse(TestRunGet);
    await this.runGet(flags as unknown as BaseFlags, '/cases/A');
  }
}

describe('BaseCommand.runGet', () => {
  let capturedRunGet: CapturedOutput;

  beforeEach(() => {
    process.env.PEGA_BASE_URL = 'https://pega.example.com';
    process.env.PEGA_CLIENT_ID = 'cid';
    process.env.PEGA_CLIENT_SECRET = 'sec';
    process.env.PEGA_NO_CACHE = 'true';
  });

  afterEach(() => {
    cleanupNock();
    capturedRunGet?.restore();
    delete process.env.PEGA_BASE_URL;
    delete process.env.PEGA_CLIENT_ID;
    delete process.env.PEGA_CLIENT_SECRET;
    delete process.env.PEGA_NO_CACHE;
  });

  test('happy path: GET emits response', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/A')
      .reply(200, { id: 'A', status: 'Open' });
    capturedRunGet = captureOutput();

    await TestRunGet.run([]);

    expect(JSON.parse(capturedRunGet.stdout.join(''))).toEqual({ id: 'A', status: 'Open' });
  });

  test('--dry-run: no HTTP call, emits dry-run JSON', async () => {
    capturedRunGet = captureOutput();
    await TestRunGet.run(['--dry-run']);
    const out = JSON.parse(capturedRunGet.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/cases/A');
    // Authorization is redacted by emitDryRun's output.dryRun
    expect(out.headers.Authorization).toBe('[REDACTED]');
    expect(out.headers['x-origin-channel']).toBe('Web');
    expect(out.headers['Content-Type']).toBeUndefined();
  });

  test('error path: 404 → fail() exits 1 with NOT_FOUND', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/A')
      .reply(404, { errors: [{ ID: 'PEGA-NF-1', message: 'not found' }] });
    capturedRunGet = captureOutput();

    // fail() calls this.exit(code) which throws an ExitError with oclif.exit = code.
    // BaseCommand.catch re-throws it, so run() rejects with the ExitError.
    let caughtError: unknown;
    await TestRunGet.run([]).catch((e) => { caughtError = e; });

    const oclifExit = (caughtError as { oclif?: { exit?: number } })?.oclif?.exit;
    expect(oclifExit).toBe(1);
    expect(capturedRunGet.stderr.join('')).toContain('NOT_FOUND');
  });
});

class TestRunDelete extends BaseCommand {
  static override id = 'test-run-delete';
  async run(): Promise<void> {
    const { flags } = await this.parse(TestRunDelete);
    await this.runDelete(flags as unknown as BaseFlags, '/cases/A/tags/urgent');
  }
}

class TestRunPost extends BaseCommand {
  static override id = 'test-run-post';
  async run(): Promise<void> {
    const { flags } = await this.parse(TestRunPost);
    await this.runPost(flags as unknown as BaseFlags, '/cases/A/followers', { user: 'U1' });
  }
}

describe('BaseCommand.runDelete', () => {
  beforeEach(() => {
    process.env.PEGA_BASE_URL = 'https://pega.example.com';
    process.env.PEGA_CLIENT_ID = 'cid';
    process.env.PEGA_CLIENT_SECRET = 'sec';
    process.env.PEGA_NO_CACHE = 'true';
  });
  afterEach(() => {
    cleanupNock();
    delete process.env.PEGA_BASE_URL;
    delete process.env.PEGA_CLIENT_ID;
    delete process.env.PEGA_CLIENT_SECRET;
    delete process.env.PEGA_NO_CACHE;
  });

  test('happy path: DELETE emits response', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .delete('/prweb/api/application/v2/cases/A/tags/urgent')
      .reply(200, { deleted: true });
    const captured = captureOutput();
    try {
      await TestRunDelete.run([]);
      expect(JSON.parse(captured.stdout.join(''))).toEqual({ deleted: true });
    } finally {
      captured.restore();
    }
  });

  test('--dry-run shows DELETE method without Content-Type', async () => {
    const captured = captureOutput();
    try {
      await TestRunDelete.run(['--dry-run']);
      const out = JSON.parse(captured.stdout.join(''));
      expect(out.method).toBe('DELETE');
      expect(out.headers['Content-Type']).toBeUndefined();
      expect(out.body).toBeUndefined();
    } finally {
      captured.restore();
    }
  });
});

describe('BaseCommand.runPost', () => {
  beforeEach(() => {
    process.env.PEGA_BASE_URL = 'https://pega.example.com';
    process.env.PEGA_CLIENT_ID = 'cid';
    process.env.PEGA_CLIENT_SECRET = 'sec';
    process.env.PEGA_NO_CACHE = 'true';
  });
  afterEach(() => {
    cleanupNock();
    delete process.env.PEGA_BASE_URL;
    delete process.env.PEGA_CLIENT_ID;
    delete process.env.PEGA_CLIENT_SECRET;
    delete process.env.PEGA_NO_CACHE;
  });

  test('happy path: POST sends body and emits response', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .post('/prweb/api/application/v2/cases/A/followers', { user: 'U1' })
      .reply(201, { added: true });
    const captured = captureOutput();
    try {
      await TestRunPost.run([]);
      expect(JSON.parse(captured.stdout.join(''))).toEqual({ added: true });
    } finally {
      captured.restore();
    }
  });

  test('--dry-run shows POST with Content-Type and body', async () => {
    const captured = captureOutput();
    try {
      await TestRunPost.run(['--dry-run']);
      const out = JSON.parse(captured.stdout.join(''));
      expect(out.method).toBe('POST');
      expect(out.headers['Content-Type']).toBe('application/json');
      expect(out.body).toEqual({ user: 'U1' });
    } finally {
      captured.restore();
    }
  });
});

describe('runPatch (no-eTag)', () => {
  class TestPatch extends BaseCommand {
    static override flags = {};
    override async run(): Promise<void> {
      const { flags } = await this.parse(TestPatch);
      await this.runPatch(flags as unknown as BaseFlags, '/attachments/test-id', {
        name: 'newname',
      });
    }
  }

  beforeEach(() => {
    process.env.PEGA_BASE_URL = 'https://pega.example.com';
    process.env.PEGA_CLIENT_ID = 'cid';
    process.env.PEGA_CLIENT_SECRET = 'sec';
    process.env.PEGA_NO_CACHE = 'true';
    if (!nock.isActive()) nock.activate();
  });
  afterEach(() => {
    cleanupNock();
    delete process.env.PEGA_BASE_URL;
    delete process.env.PEGA_CLIENT_ID;
    delete process.env.PEGA_CLIENT_SECRET;
    delete process.env.PEGA_NO_CACHE;
  });

  test('issues PATCH without If-Match header and emits response', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com', {
      badheaders: ['if-match'],
    })
      .patch('/prweb/api/application/v2/attachments/test-id', { name: 'newname' })
      .reply(200, { updated: true });
    const captured = captureOutput();
    try {
      await TestPatch.run([]);
      expect(scope.isDone()).toBe(true);
      expect(JSON.parse(captured.stdout.join(''))).toEqual({ updated: true });
    } finally {
      captured.restore();
    }
  });

  test('--dry-run shows PATCH with Content-Type and body, no If-Match', async () => {
    const captured = captureOutput();
    try {
      await TestPatch.run(['--dry-run']);
      const out = JSON.parse(captured.stdout.join(''));
      expect(out.method).toBe('PATCH');
      expect(out.headers['Content-Type']).toBe('application/json');
      expect(out.body).toEqual({ name: 'newname' });
      expect(out.headers['If-Match']).toBeUndefined();
    } finally {
      captured.restore();
    }
  });
});

class TestRunMutateWithEtag extends BaseCommand {
  static override id = 'test-run-mutate';
  async run(): Promise<void> {
    const { flags } = await this.parse(TestRunMutateWithEtag);
    await this.runMutateWithEtag(
      flags as unknown as BaseFlags,
      'PATCH',
      '/cases/A',
      '/cases/A/actions/Submit',
      { content: { foo: 'bar' } },
    );
  }
}

class TestRunMutateWithEtagPut extends BaseCommand {
  static override id = 'test-run-mutate-put';
  async run(): Promise<void> {
    const { flags } = await this.parse(TestRunMutateWithEtagPut);
    await this.runMutateWithEtag(
      flags as unknown as BaseFlags,
      'PUT',
      '/cases/A',
      '/cases/A/stages/Stage2',
      {},
    );
  }
}

describe('BaseCommand.runMutateWithEtag', () => {
  beforeEach(() => {
    process.env.PEGA_BASE_URL = 'https://pega.example.com';
    process.env.PEGA_CLIENT_ID = 'cid';
    process.env.PEGA_CLIENT_SECRET = 'sec';
    process.env.PEGA_NO_CACHE = 'true';
  });
  afterEach(() => {
    cleanupNock();
    delete process.env.PEGA_BASE_URL;
    delete process.env.PEGA_CLIENT_ID;
    delete process.env.PEGA_CLIENT_SECRET;
    delete process.env.PEGA_NO_CACHE;
  });

  test('PATCH: GETs parent, forwards eTag in If-Match', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/A')
      .reply(200, { id: 'A' }, { ETag: '"abc123"' });
    nock('https://pega.example.com', { reqheaders: { 'if-match': '"abc123"' } })
      .patch('/prweb/api/application/v2/cases/A/actions/Submit', { content: { foo: 'bar' } })
      .reply(200, { id: 'A', status: 'Updated' });

    const captured = captureOutput();
    try {
      await TestRunMutateWithEtag.run([]);
      expect(JSON.parse(captured.stdout.join(''))).toEqual({ id: 'A', status: 'Updated' });
    } finally {
      captured.restore();
    }
  });

  test('PUT: same flow, method=PUT', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/A')
      .reply(200, { id: 'A' }, { ETag: '"e2"' });
    nock('https://pega.example.com', { reqheaders: { 'if-match': '"e2"' } })
      .put('/prweb/api/application/v2/cases/A/stages/Stage2', {})
      .reply(200, { id: 'A', stage: 'Stage2' });

    const captured = captureOutput();
    try {
      await TestRunMutateWithEtagPut.run([]);
      expect(JSON.parse(captured.stdout.join(''))).toEqual({ id: 'A', stage: 'Stage2' });
    } finally {
      captured.restore();
    }
  });

  test('--dry-run shows method + If-Match placeholder', async () => {
    const captured = captureOutput();
    try {
      await TestRunMutateWithEtag.run(['--dry-run']);
      const out = JSON.parse(captured.stdout.join(''));
      expect(out.method).toBe('PATCH');
      expect(out.headers['If-Match']).toBe('<etag-from-GET>');
      expect(out.headers['Content-Type']).toBe('application/json');
      expect(out.body).toEqual({ content: { foo: 'bar' } });
    } finally {
      captured.restore();
    }
  });

  test('GET returns no eTag → throws MISSING_ETAG', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/cases/A')
      .reply(200, { id: 'A' }); // no ETag header

    const captured = captureOutput();
    let caughtError: { oclif?: { exit?: number } } | undefined;
    try {
      await TestRunMutateWithEtag.run([]);
    } catch (e) {
      caughtError = e as { oclif?: { exit?: number } };
    } finally {
      captured.restore();
    }
    expect(caughtError?.oclif?.exit).toBe(1);
    expect(captured.stderr.join('')).toContain('MISSING_ETAG');
  });
});
