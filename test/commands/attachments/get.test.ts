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

const { default: AttachmentsGet } = await import('../../../src/commands/attachments/get.js');

let captured: CapturedOutput;
let origEmitWarning: typeof process.emitWarning;

beforeEach(() => {
  resetMockFs();
  // Pre-create directories used by --output tests
  vol.mkdirSync('/tmp', { recursive: true });
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

describe('attachments get', () => {
  test('no --output: emits raw JSON response', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/attachments/ATTACH-1')
      .reply(200, { ID: 'ATTACH-1', type: 'File', name: 'doc.pdf' });

    captured = captureOutput();
    await AttachmentsGet.run(['ATTACH-1']);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({
      ID: 'ATTACH-1',
      type: 'File',
      name: 'doc.pdf',
    });
  });

  test('--output with type=File: Base64-decodes content and writes bytes to disk', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const originalContent = 'Hello PDF content';
    const base64Content = Buffer.from(originalContent).toString('base64');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/attachments/ATTACH-1')
      .reply(200, { type: 'File', content: base64Content, name: 'doc.pdf' });

    captured = captureOutput();
    await AttachmentsGet.run(['ATTACH-1', '--output', '/tmp/out.pdf']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.type).toBe('File');
    expect(out.path).toBe('/tmp/out.pdf');
    expect(out.bytes).toBe(originalContent.length);
    // Verify the file was written with decoded content
    const written = readMockFile('/tmp/out.pdf');
    expect(written).toBe(originalContent);
  });

  test('--output with type=URL: writes URL string to disk', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/attachments/ATTACH-URL')
      .reply(200, { type: 'URL', url: 'https://example.com/file.pdf' });

    captured = captureOutput();
    await AttachmentsGet.run(['ATTACH-URL', '--output', '/tmp/link.txt']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.type).toBe('URL');
    expect(out.path).toBe('/tmp/link.txt');
    const written = readMockFile('/tmp/link.txt');
    expect(written).toBe('https://example.com/file.pdf');
  });

  test('--output with type=Correspondence: writes HTML content to disk', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const htmlContent = '<html><body>Hello</body></html>';
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/attachments/ATTACH-CORR')
      .reply(200, { type: 'Correspondence', content: htmlContent });

    captured = captureOutput();
    await AttachmentsGet.run(['ATTACH-CORR', '--output', '/tmp/corr.html']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.type).toBe('Correspondence');
    expect(out.path).toBe('/tmp/corr.html');
    const written = readMockFile('/tmp/corr.html');
    expect(written).toBe(htmlContent);
  });

  test('--output with unknown type: writes JSON fallback to disk', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/attachments/ATTACH-X')
      .reply(200, { type: 'Custom', someField: 'someValue' });

    captured = captureOutput();
    await AttachmentsGet.run(['ATTACH-X', '--output', '/tmp/custom.json']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.type).toBe('Custom');
    expect(out.path).toBe('/tmp/custom.json');
    const written = readMockFile('/tmp/custom.json');
    expect(JSON.parse(written)).toMatchObject({ type: 'Custom', someField: 'someValue' });
  });

  test('URL-encodes the attachment id', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const idWithSpace = 'MYAPP attach 123';
    const encodedId = encodeURIComponent(idWithSpace);
    // Verify encoding contains %20 for spaces
    expect(encodedId).toContain('%20');
    const scope = nock('https://pega.example.com')
      .get(`/prweb/api/application/v2/attachments/${encodedId}`)
      .reply(200, { type: 'File', name: 'test.pdf' });

    captured = captureOutput();
    await AttachmentsGet.run([idWithSpace]);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run emits GET method with correct URL and no network call', async () => {
    captured = captureOutput();
    await AttachmentsGet.run(['ATTACH-1', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toBe(
      'https://pega.example.com/prweb/api/application/v2/attachments/ATTACH-1',
    );
  });

  test('--dry-run with --output emits GET method, correct URL, no write', async () => {
    captured = captureOutput();
    await AttachmentsGet.run(['ATTACH-1', '--output', '/tmp/out.pdf', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toBe(
      'https://pega.example.com/prweb/api/application/v2/attachments/ATTACH-1',
    );
    // No file should have been written
    expect(() => readMockFile('/tmp/out.pdf')).toThrow();
  });

  test('404 emits structured error and exits 1', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/attachments/MISSING')
      .reply(404, { localizedValue: 'Not found' });

    captured = captureOutput();
    await expect(AttachmentsGet.run(['MISSING'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
