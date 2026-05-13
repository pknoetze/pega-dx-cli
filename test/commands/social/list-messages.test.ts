import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import SocialListMessages from '../../../src/commands/social/list-messages.js';

let captured: CapturedOutput;
let origEmitWarning: typeof process.emitWarning;

beforeEach(() => {
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

describe('social list-messages', () => {
  test('happy path with both required flags returns messages', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .get('/prweb/api/application/v2/messages')
      .query({ filterBy: 'Pulse', filterFor: 'MYORG-WORK!M-1' })
      .reply(200, { messages: [] });

    captured = captureOutput();
    await SocialListMessages.run(['--filter-by', 'Pulse', '--filter-for', 'MYORG-WORK!M-1']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ messages: [] });
  });

  test('optional page-size and older-than forwarded', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .get('/prweb/api/application/v2/messages')
      .query({ filterBy: 'Pulse', filterFor: 'CTX-1', pageSize: '5', olderThan: '2024-01-01' })
      .reply(200, {});

    captured = captureOutput();
    await SocialListMessages.run([
      '--filter-by', 'Pulse',
      '--filter-for', 'CTX-1',
      '--page-size', '5',
      '--older-than', '2024-01-01',
    ]);
    expect(scope.isDone()).toBe(true);
  });

  test('missing --filter-by rejects before network', async () => {
    captured = captureOutput();
    await expect(SocialListMessages.run(['--filter-for', 'CTX-1'])).rejects.toThrow();
  });

  test('missing --filter-for rejects before network', async () => {
    captured = captureOutput();
    await expect(SocialListMessages.run(['--filter-by', 'Pulse'])).rejects.toThrow();
  });

  test('--dry-run emits GET with correct URL', async () => {
    captured = captureOutput();
    await SocialListMessages.run(['--filter-by', 'Pulse', '--filter-for', 'CTX-1', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toContain('/prweb/api/application/v2/messages');
    expect(out.url).toContain('filterBy=Pulse');
    expect(out.url).toContain('filterFor=CTX-1');
  });

  test('404 emits structured error', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/messages')
      .query(true)
      .reply(404, { localizedValue: 'Not found' });

    captured = captureOutput();
    await expect(SocialListMessages.run(['--filter-by', 'Pulse', '--filter-for', 'CTX-1'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
