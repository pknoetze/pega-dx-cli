import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { vol } from 'memfs';
import { resetMockFs } from '../../helpers/mock-filesystem.js';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, mockMultipartUpload, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});
jest.unstable_mockModule('node:fs/promises', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs.promises, default: memfs.fs.promises };
});

const { default: AttachmentsUpload } = await import('../../../src/commands/attachments/upload.js');

let captured: CapturedOutput;
let origEmitWarning: typeof process.emitWarning;

beforeEach(() => {
  resetMockFs();
  vol.mkdirSync('/tmp', { recursive: true });
  // Seed a fake file for upload tests
  vol.writeFileSync('/tmp/test.pdf', 'fake-pdf-content');
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

describe('attachments upload', () => {
  test('happy path: uploads file and emits response with temp ID', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockMultipartUpload('https://pega.example.com', '/attachments/upload', 200, {
      ID: 'temp-uuid-123',
    });

    captured = captureOutput();
    await AttachmentsUpload.run(['--file', '/tmp/test.pdf']);
    const out = JSON.parse(captured.stdout.join('')) as Record<string, unknown>;
    expect(out).toEqual({ ID: 'temp-uuid-123' });
  });

  test('--append-unique-id: uploads and emits response', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockMultipartUpload('https://pega.example.com', '/attachments/upload', 200, {
      ID: 'temp-uuid-unique',
    });

    captured = captureOutput();
    await AttachmentsUpload.run(['--file', '/tmp/test.pdf', '--append-unique-id']);
    const out = JSON.parse(captured.stdout.join('')) as Record<string, unknown>;
    expect(out).toEqual({ ID: 'temp-uuid-unique' });
  });

  test('missing file: exits with code 2 (INVALID_ARGS)', async () => {
    captured = captureOutput();
    await expect(
      AttachmentsUpload.run(['--file', '/tmp/nonexistent-file.pdf']),
    ).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'INVALID_ARGS', httpStatus: 0 });
  });

  test('unreadable file: exits with INVALID_ARGS including OS error message', async () => {
    vol.writeFileSync('/tmp/locked.pdf', 'data');
    vol.chmodSync('/tmp/locked.pdf', 0o000);
    captured = captureOutput();
    await expect(
      AttachmentsUpload.run(['--file', '/tmp/locked.pdf']),
    ).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'INVALID_ARGS', httpStatus: 0 });
    expect(typeof err.message).toBe('string');
    expect(err.message as string).toContain('/tmp/locked.pdf');
  });

  test('--dry-run: emits POST summary with filename, no network call', async () => {
    captured = captureOutput();
    await AttachmentsUpload.run(['--file', '/tmp/test.pdf', '--dry-run']);
    const out = JSON.parse(captured.stdout.join('')) as Record<string, unknown>;
    expect(out.method).toBe('POST');
    expect(out.url).toBe(
      'https://pega.example.com/prweb/api/application/v2/attachments/upload',
    );
    expect((out.body as Record<string, unknown>).file).toBe('test.pdf');
  });

  test('5xx error: command exits with error', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockMultipartUpload('https://pega.example.com', '/attachments/upload', 500, {
      message: 'Internal Server Error',
    });

    captured = captureOutput();
    await expect(AttachmentsUpload.run(['--file', '/tmp/test.pdf'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 });
  });
});
