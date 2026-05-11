import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import AiAgentsDislike from '../../../src/commands/ai-agents/dislike.js';

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

describe('ai-agents dislike', () => {
  test('PUTs to .../dislike with body {feedbackText: ...}', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .put(
        '/prweb/api/application/v2/ai-agents/MYAGENT/conversations/PXCONV-1/messages/MSG-1/dislike',
        { feedbackText: 'off topic' },
      )
      .reply(200, '');

    captured = captureOutput();
    await AiAgentsDislike.run([
      'MYAGENT', '--conversation', 'PXCONV-1', '--message', 'MSG-1', '--feedback', 'off topic',
    ]);
    expect(scope.isDone()).toBe(true);
  });

  test('missing --feedback → oclif required-flag error', async () => {
    captured = captureOutput();
    await expect(
      AiAgentsDislike.run(['MYAGENT', '--conversation', 'PXCONV-1', '--message', 'MSG-1']),
    ).rejects.toThrow();
  });

  test('URL-encodes the agentID path segment', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const agentId = 'MY AGENT';
    const path = `/prweb/api/application/v2/ai-agents/${encodeURIComponent(agentId)}/conversations/PXCONV-1/messages/MSG-1/dislike`;
    expect(path).toContain('%20');
    const scope = nock('https://pega.example.com')
      .put(path, { feedbackText: 'x' })
      .reply(200, '');

    captured = captureOutput();
    await AiAgentsDislike.run([agentId, '--conversation', 'PXCONV-1', '--message', 'MSG-1', '--feedback', 'x']);
    expect(scope.isDone()).toBe(true);
  });
});
