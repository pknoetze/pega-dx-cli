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

const { default: StaticContentProfileImage } = await import(
  '../../../src/commands/static-content/profile-image.js'
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

describe('static-content profile-image', () => {
  test('no --output: writes raw image bytes to stdout', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const imageData = 'fake-image-bytes';
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/users/user123/profile-image')
      .reply(200, imageData, { 'Content-Type': 'image/jpeg' });

    captured = captureOutput();
    await StaticContentProfileImage.run(['user123']);
    expect(captured.stdout.join('')).toBe(imageData);
  });

  test('--output: writes bytes to file and emits JSON metadata', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const imageData = 'fake-image-bytes\n';
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/users/user123/profile-image')
      .reply(200, imageData, { 'Content-Type': 'image/jpeg' });

    captured = captureOutput();
    await StaticContentProfileImage.run(['user123', '--output', '/tmp/profile.jpg']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out).toMatchObject({
      path: '/tmp/profile.jpg',
      bytes: imageData.length,
      contentType: 'image/jpeg',
    });
    expect(readMockFile('/tmp/profile.jpg')).toBe(imageData);
  });

  test('URL-encodes the userId', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const idWithSpace = 'user 123';
    const scope = nock('https://pega.example.com')
      .get(`/prweb/api/application/v2/users/${encodeURIComponent(idWithSpace)}/profile-image`)
      .reply(200, '', { 'Content-Type': 'image/jpeg' });

    captured = captureOutput();
    await StaticContentProfileImage.run([idWithSpace]);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run emits GET request without network', async () => {
    captured = captureOutput();
    await StaticContentProfileImage.run(['user123', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/users/user123/profile-image');
  });

  test('404 emits structured error and exits 1', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/users/missing-user/profile-image')
      .reply(404, { localizedValue: 'User not found' }, { 'Content-Type': 'application/json' });

    captured = captureOutput();
    await expect(StaticContentProfileImage.run(['missing-user'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
