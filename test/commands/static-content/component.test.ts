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

const { default: StaticContentComponent } = await import(
  '../../../src/commands/static-content/component.js'
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

describe('static-content component', () => {
  test('no --output: writes raw JS to stdout', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const js = 'export const x = 42;';
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/components/COMP-1')
      .reply(200, js, { 'Content-Type': 'application/javascript' });

    captured = captureOutput();
    await StaticContentComponent.run(['COMP-1']);
    expect(captured.stdout.join('')).toBe(js);
  });

  test('--output: writes bytes to file and emits JSON metadata', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const js = 'export const x = 1;\n';
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/components/COMP-1')
      .reply(200, js, { 'Content-Type': 'application/javascript' });

    captured = captureOutput();
    await StaticContentComponent.run(['COMP-1', '--output', '/tmp/comp.js']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out).toMatchObject({
      path: '/tmp/comp.js',
      bytes: js.length,
      contentType: 'application/javascript',
    });
    expect(readMockFile('/tmp/comp.js')).toBe(js);
  });

  test('URL-encodes the componentID', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const idWithSpace = 'My Component';
    const scope = nock('https://pega.example.com')
      .get(`/prweb/api/application/v2/components/${encodeURIComponent(idWithSpace)}`)
      .reply(200, '', { 'Content-Type': 'application/javascript' });

    captured = captureOutput();
    await StaticContentComponent.run([idWithSpace]);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run emits GET request without network', async () => {
    captured = captureOutput();
    await StaticContentComponent.run(['COMP-1', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/components/COMP-1');
  });

  test('--dry-run with --output does not write file', async () => {
    captured = captureOutput();
    await StaticContentComponent.run(['COMP-1', '--output', '/tmp/comp.js', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/components/COMP-1');
    expect(() => readMockFile('/tmp/comp.js')).toThrow();
  });

  test('404 emits structured error and exits 1', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/components/MISSING')
      .reply(404, { localizedValue: 'Component not found' }, { 'Content-Type': 'application/json' });

    captured = captureOutput();
    await expect(StaticContentComponent.run(['MISSING'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
