import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import AiAgentsStartConversation from '../../../src/commands/ai-agents/start-conversation.js';

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

describe('ai-agents start-conversation', () => {
  test('no flags → empty body', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .post('/prweb/api/application/v2/ai-agents/MYAGENT/conversations', {})
      .reply(201, { ID: 'PXCONV-1' });

    captured = captureOutput();
    await AiAgentsStartConversation.run(['MYAGENT']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ ID: 'PXCONV-1' });
  });

  test('all flags compose the expected body', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const expectedBody = {
      contextID: 'CTX',
      interactionID: 'IX',
      executeStarterQuestion: true,
      activeChannel: 'Web',
      activeChannelID: 'CH1',
    };
    const scope = nock('https://pega.example.com')
      .post('/prweb/api/application/v2/ai-agents/MYAGENT/conversations', expectedBody)
      .reply(201, { ID: 'PXCONV-2' });

    captured = captureOutput();
    await AiAgentsStartConversation.run([
      'MYAGENT',
      '--context-id', 'CTX',
      '--interaction-id', 'IX',
      '--execute-starter',
      '--active-channel', 'Web',
      '--active-channel-id', 'CH1',
    ]);
    expect(scope.isDone()).toBe(true);
  });

  test('--no-execute-starter emits executeStarterQuestion: false', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .post('/prweb/api/application/v2/ai-agents/MYAGENT/conversations', { executeStarterQuestion: false })
      .reply(201, { ID: 'PXCONV-3' });

    captured = captureOutput();
    await AiAgentsStartConversation.run(['MYAGENT', '--no-execute-starter']);
    expect(scope.isDone()).toBe(true);
  });

  test('URL-encodes the agentID', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const agentId = 'MY AGENT';
    const scope = nock('https://pega.example.com')
      .post(`/prweb/api/application/v2/ai-agents/${encodeURIComponent(agentId)}/conversations`, {})
      .reply(201, { ID: 'PXCONV-4' });
    expect(encodeURIComponent(agentId)).toContain('%20');

    captured = captureOutput();
    await AiAgentsStartConversation.run([agentId]);
    expect(scope.isDone()).toBe(true);
  });
});
