import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import AiAgentsListConversations from '../../../src/commands/ai-agents/list-conversations.js';

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

describe('ai-agents list-conversations', () => {
  test('passes contextID + agentID encoded; supports paging', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .get('/prweb/api/application/v2/ai-agents/MYAGENT/conversations')
      .query({ contextID: 'CTX', pageSize: '20', pageIndex: '0' })
      .reply(200, { conversations: [] });

    captured = captureOutput();
    await AiAgentsListConversations.run([
      'MYAGENT', '--context-id', 'CTX', '--page-size', '20', '--page-index', '0',
    ]);
    expect(scope.isDone()).toBe(true);
  });

  test('URL-encodes agentID and contextID with special characters', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const agentId = 'MY AGENT';
    const ctx = 'MYORG-WORK!M-123';
    expect(encodeURIComponent(agentId)).toContain('%20');
    const scope = nock('https://pega.example.com')
      .get(`/prweb/api/application/v2/ai-agents/${encodeURIComponent(agentId)}/conversations`)
      .query({ contextID: ctx }) // nock's query() URL-encodes for us
      .reply(200, { conversations: [] });

    captured = captureOutput();
    await AiAgentsListConversations.run([agentId, '--context-id', ctx]);
    expect(scope.isDone()).toBe(true);
  });
});
