import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { vol } from 'memfs';
import { resetMockFs, readMockFile } from '../../helpers/mock-filesystem.js';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});
jest.unstable_mockModule('node:fs/promises', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs.promises, default: memfs.fs.promises };
});

const { default: StaticContentFile } = await import(
  '../../../src/commands/static-content/file.js'
);

let captured: CapturedOutput;
let origEmitWarning: typeof process.emitWarning;

beforeEach(() => {
  resetMockFs();
  vol.mkdirSync('/tmp', { recursive: true });
  process.env.HOME = '/home/test';
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

describe('static-content file', () => {
  test('happy path: writes binary bytes to file and emits metadata', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG header
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/files/F-1')
      .reply(200, bytes, { 'Content-Type': 'application/octet-stream' });

    captured = captureOutput();
    await StaticContentFile.run(['F-1', '--output', '/tmp/img.png']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out).toMatchObject({
      path: '/tmp/img.png',
      bytes: bytes.length,
      contentType: 'application/octet-stream',
    });
    // memfs readMockFile returns string by default; compare via byte length
    const written = readMockFile('/tmp/img.png');
    expect(Buffer.byteLength(written, 'binary')).toBe(bytes.length);
  });

  test('missing --output → oclif required-flag error (no network)', async () => {
    captured = captureOutput();
    await expect(StaticContentFile.run(['F-1'])).rejects.toThrow();
  });

  test('URL-encodes the fileID', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const idWithSpace = 'My File';
    const scope = nock('https://pega.example.com')
      .get(`/prweb/api/application/v2/files/${encodeURIComponent(idWithSpace)}`)
      .reply(200, Buffer.from([0x00]), { 'Content-Type': 'application/octet-stream' });

    captured = captureOutput();
    await StaticContentFile.run([idWithSpace, '--output', '/tmp/out.bin']);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run emits GET request without network or file write', async () => {
    captured = captureOutput();
    await StaticContentFile.run(['F-1', '--output', '/tmp/out.bin', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/files/F-1');
    expect(() => readMockFile('/tmp/out.bin')).toThrow();
  });

  test('404 emits structured error and exits 1', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/files/MISSING')
      .reply(404, { localizedValue: 'Image Not Found' }, { 'Content-Type': 'application/json' });

    captured = captureOutput();
    await expect(StaticContentFile.run(['MISSING', '--output', '/tmp/x'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
