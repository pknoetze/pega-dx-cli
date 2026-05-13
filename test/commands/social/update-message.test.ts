import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import SocialUpdateMessage from '../../../src/commands/social/update-message.js';

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

describe('social update-message', () => {
  test('happy path: PUTs message body and emits text/plain "Accept" response', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .put('/prweb/api/application/v2/messages/MSG-1', { message: 'edited' })
      .reply(200, 'Accept', { 'Content-Type': 'text/plain' });
    captured = captureOutput();
    await SocialUpdateMessage.run(['MSG-1', '--message', 'edited']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ message: 'Accept' });
  });

  test('URL-encodes messageID', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const messageID = 'MSG with space';
    const scope = nock('https://pega.example.com')
      .put(`/prweb/api/application/v2/messages/${encodeURIComponent(messageID)}`, { message: 'edited' })
      .reply(200, 'Accept', { 'Content-Type': 'text/plain' });
    captured = captureOutput();
    await SocialUpdateMessage.run([messageID, '--message', 'edited']);
    expect(scope.isDone()).toBe(true);
  });

  test('body-shape: --route-to-workbasket adds pyRouteToWorkbasket', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .put('/prweb/api/application/v2/messages/MSG-1', { message: 'edited', pyRouteToWorkbasket: 'WB-1' })
      .reply(200, 'Accept', { 'Content-Type': 'text/plain' });
    captured = captureOutput();
    await SocialUpdateMessage.run(['MSG-1', '--message', 'edited', '--route-to-workbasket', 'WB-1']);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run emits PUT with body and Content-Type', async () => {
    captured = captureOutput();
    await SocialUpdateMessage.run(['MSG-1', '--message', 'edited', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('PUT');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/messages/MSG-1');
    expect(out.headers['Content-Type']).toBe('application/json');
    expect(out.body).toEqual({ message: 'edited' });
  });

  test('missing --message rejects before network', async () => {
    captured = captureOutput();
    await expect(SocialUpdateMessage.run(['MSG-1'])).rejects.toThrow();
  });

  test('404 emits structured error', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .put('/prweb/api/application/v2/messages/MISSING', { message: 'edited' })
      .reply(404, { localizedValue: 'Not found' });
    captured = captureOutput();
    await expect(SocialUpdateMessage.run(['MISSING', '--message', 'edited'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
