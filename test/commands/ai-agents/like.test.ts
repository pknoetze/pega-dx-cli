import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import AiAgentsLike from '../../../src/commands/ai-agents/like.js';

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

describe('ai-agents like', () => {
  test('PUTs to .../like with no body and no Content-Type header', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com', {
      badheaders: ['content-type'], // nock asserts this header is ABSENT
    })
      .put('/prweb/api/application/v2/ai-agents/MYAGENT/conversations/PXCONV-1/messages/MSG-1/like')
      .reply(200, '');

    captured = captureOutput();
    await AiAgentsLike.run(['MYAGENT', '--conversation', 'PXCONV-1', '--message', 'MSG-1']);
    expect(scope.isDone()).toBe(true);
  });

  test('URL-encodes all three path segments', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const agentId = 'MY AGENT';
    const convId = 'PXCONV 1';
    const msgId = 'MSG 1';
    const path = `/prweb/api/application/v2/ai-agents/${encodeURIComponent(agentId)}/conversations/${encodeURIComponent(convId)}/messages/${encodeURIComponent(msgId)}/like`;
    expect(path).toContain('%20');
    const scope = nock('https://pega.example.com').put(path).reply(200, '');

    captured = captureOutput();
    await AiAgentsLike.run([agentId, '--conversation', convId, '--message', msgId]);
    expect(scope.isDone()).toBe(true);
  });
});
