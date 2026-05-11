import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import AssistantsSendMessage from '../../../src/commands/assistants/send-message.js';

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

describe('assistants send-message', () => {
  test('PATCHes with body exactly {Request: "..."}; no other fields', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/assistants/MYASSISTANT/conversations/PXCONV-1', (body) => {
        expect(body).toEqual({ Request: 'hello' });  // exact match
        return true;
      })
      .reply(200, { response: 'hi back' });

    captured = captureOutput();
    await AssistantsSendMessage.run(['MYASSISTANT', '--conversation', 'PXCONV-1', '--request', 'hello']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ response: 'hi back' });
  });

  test('URL-encodes assistantID and conversationID', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const assistantId = 'MY ASSISTANT';
    const path = `/prweb/api/application/v2/assistants/${encodeURIComponent(assistantId)}/conversations/PXCONV-1`;
    expect(path).toContain('%20');
    const scope = nock('https://pega.example.com').patch(path, { Request: 'x' }).reply(200, {});

    captured = captureOutput();
    await AssistantsSendMessage.run([assistantId, '--conversation', 'PXCONV-1', '--request', 'x']);
    expect(scope.isDone()).toBe(true);
  });
});
