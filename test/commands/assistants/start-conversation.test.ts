import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import AssistantsStartConversation from '../../../src/commands/assistants/start-conversation.js';

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

describe('assistants start-conversation', () => {
  test('all three flags compose body; no activeChannel fields exist', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .post('/prweb/api/application/v2/assistants/MYASSISTANT/conversations', {
        contextID: 'CTX', interactionID: 'IX', executeStarterQuestion: true,
      })
      .reply(201, { ID: 'PXCONV-1' });

    captured = captureOutput();
    await AssistantsStartConversation.run([
      'MYASSISTANT', '--context-id', 'CTX', '--interaction-id', 'IX', '--execute-starter',
    ]);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ ID: 'PXCONV-1' });
  });

  test('URL-encodes the assistantID', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const assistantId = 'MY ASSISTANT';
    const scope = nock('https://pega.example.com')
      .post(`/prweb/api/application/v2/assistants/${encodeURIComponent(assistantId)}/conversations`, {})
      .reply(201, { ID: 'X' });
    expect(encodeURIComponent(assistantId)).toContain('%20');

    captured = captureOutput();
    await AssistantsStartConversation.run([assistantId]);
    expect(scope.isDone()).toBe(true);
  });
});
