import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import AssistantsGetConversation from '../../../src/commands/assistants/get-conversation.js';

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

describe('assistants get-conversation', () => {
  test('GETs URL-encoded path', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const assistantId = 'MY ASSISTANT';
    const convId = 'PXCONV 1';
    const path = `/prweb/api/application/v2/assistants/${encodeURIComponent(assistantId)}/conversations/${encodeURIComponent(convId)}`;
    expect(path).toContain('%20');
    const scope = nock('https://pega.example.com').get(path).reply(200, { id: 'X' });

    captured = captureOutput();
    await AssistantsGetConversation.run([assistantId, '--conversation', convId]);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ id: 'X' });
  });
});
