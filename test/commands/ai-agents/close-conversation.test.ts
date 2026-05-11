import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import AiAgentsCloseConversation from '../../../src/commands/ai-agents/close-conversation.js';

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

describe('ai-agents close-conversation', () => {
  test('PUTs to .../close with no body; URL-encodes IDs; emits text-wrapped response', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const agentId = 'MY AGENT';
    const convId = 'PXCONV 1';
    const path = `/prweb/api/application/v2/ai-agents/${encodeURIComponent(agentId)}/conversations/${encodeURIComponent(convId)}/close`;
    expect(path).toContain('%20');
    // Reply text/plain — parseBody wraps as {message: "..."}
    const scope = nock('https://pega.example.com')
      .put(path)
      .reply(200, 'Conversation is closed successfully.', { 'Content-Type': 'text/plain' });

    captured = captureOutput();
    await AiAgentsCloseConversation.run([agentId, '--conversation', convId]);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ message: 'Conversation is closed successfully.' });
  });

  test('--dry-run emits PUT with no Content-Type and no body field', async () => {
    captured = captureOutput();
    await AiAgentsCloseConversation.run(['MYAGENT', '--conversation', 'PXCONV-1', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('PUT');
    expect(out.headers['Content-Type']).toBeUndefined();
    expect(out).not.toHaveProperty('body');
  });
});
