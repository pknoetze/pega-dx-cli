import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import SocialPostMessage from '../../../src/commands/social/post-message.js';

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

describe('social post-message', () => {
  test('happy path: posts minimal body and emits 201 response', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .post('/prweb/api/application/v2/messages', { context: 'CTX-1', message: 'hi' })
      .reply(201, 'Accept', { 'Content-Type': 'text/plain' });
    captured = captureOutput();
    await SocialPostMessage.run(['--context', 'CTX-1', '--message', 'hi']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ message: 'Accept' });
  });

  test('--message-type appends ?message-type= to URL (not body)', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .post('/prweb/api/application/v2/messages', { context: 'CTX-1', message: 'hi' })
      .query({ 'message-type': 'Pulse-Post' })
      .reply(201, 'Accept', { 'Content-Type': 'text/plain' });
    captured = captureOutput();
    await SocialPostMessage.run(['--context', 'CTX-1', '--message', 'hi', '--message-type', 'Pulse-Post']);
    expect(scope.isDone()).toBe(true);
  });

  test('--route-to-workbasket adds pyRouteToWorkbasket to body', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .post('/prweb/api/application/v2/messages', {
        context: 'CTX-1', message: 'hi', pyRouteToWorkbasket: 'WB-1',
      })
      .reply(201, 'Accept', { 'Content-Type': 'text/plain' });
    captured = captureOutput();
    await SocialPostMessage.run(['--context', 'CTX-1', '--message', 'hi', '--route-to-workbasket', 'WB-1']);
    expect(scope.isDone()).toBe(true);
  });

  test('missing --context rejects before network', async () => {
    captured = captureOutput();
    await expect(SocialPostMessage.run(['--message', 'hi'])).rejects.toThrow();
  });

  test('missing --message rejects before network', async () => {
    captured = captureOutput();
    await expect(SocialPostMessage.run(['--context', 'CTX-1'])).rejects.toThrow();
  });

  test('--dry-run emits POST request with body and Content-Type', async () => {
    captured = captureOutput();
    await SocialPostMessage.run(['--context', 'CTX-1', '--message', 'hi', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('POST');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/messages');
    expect(out.headers['Content-Type']).toBe('application/json');
    expect(out.body).toEqual({ context: 'CTX-1', message: 'hi' });
  });
});
