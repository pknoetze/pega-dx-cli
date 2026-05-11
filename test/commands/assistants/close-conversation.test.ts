import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import AssistantsCloseConversation from '../../../src/commands/assistants/close-conversation.js';

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

describe('assistants close-conversation', () => {
  test('PUTs to .../close with no body; text/plain response wrapped', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com', { badheaders: ['content-type'] })
      .put('/prweb/api/application/v2/assistants/MYASSISTANT/conversations/PXCONV-1/close')
      .reply(200, 'Conversation is closed successfully.', { 'Content-Type': 'text/plain' });

    captured = captureOutput();
    await AssistantsCloseConversation.run(['MYASSISTANT', '--conversation', 'PXCONV-1']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ message: 'Conversation is closed successfully.' });
  });

  test('URL-encodes assistantID and conversationID', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const assistantId = 'MY ASSISTANT';
    const convId = 'PXCONV 1';
    const path = `/prweb/api/application/v2/assistants/${encodeURIComponent(assistantId)}/conversations/${encodeURIComponent(convId)}/close`;
    expect(path).toContain('%20');
    const scope = nock('https://pega.example.com').put(path).reply(200, '');

    captured = captureOutput();
    await AssistantsCloseConversation.run([assistantId, '--conversation', convId]);
    expect(scope.isDone()).toBe(true);
  });
});
