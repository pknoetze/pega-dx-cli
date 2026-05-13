import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import SocialDeleteMessage from '../../../src/commands/social/delete-message.js';

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

describe('social delete-message', () => {
  test('happy path: DELETEs message and emits text/plain "Accept" response', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .delete('/prweb/api/application/v2/messages/MSG-1')
      .reply(200, 'Accept', { 'Content-Type': 'text/plain' });
    captured = captureOutput();
    await SocialDeleteMessage.run(['MSG-1']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ message: 'Accept' });
  });

  test('URL-encodes messageID', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const messageID = 'MSG with space';
    const scope = nock('https://pega.example.com')
      .delete(`/prweb/api/application/v2/messages/${encodeURIComponent(messageID)}`)
      .reply(200, 'Accept', { 'Content-Type': 'text/plain' });
    captured = captureOutput();
    await SocialDeleteMessage.run([messageID]);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run emits DELETE with correct URL and no body', async () => {
    captured = captureOutput();
    await SocialDeleteMessage.run(['MSG-1', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('DELETE');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/messages/MSG-1');
    expect(out.body).toBeUndefined();
  });

  test('404 emits structured error', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .delete('/prweb/api/application/v2/messages/MISSING')
      .reply(404, { localizedValue: 'Not found' });
    captured = captureOutput();
    await expect(SocialDeleteMessage.run(['MISSING'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
