import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import AssistantsListConversations from '../../../src/commands/assistants/list-conversations.js';

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

describe('assistants list-conversations', () => {
  test('happy path: --context-id only', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assistants/MYASSISTANT/conversations')
      .query({ contextID: 'CTX' })
      .reply(200, { conversations: [] });

    captured = captureOutput();
    await AssistantsListConversations.run(['MYASSISTANT', '--context-id', 'CTX']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ conversations: [] });
  });

  test('paging flags compose query string', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assistants/MYASSISTANT/conversations')
      .query({ contextID: 'CTX', pageSize: '20', pageIndex: '2' })
      .reply(200, { conversations: [] });

    captured = captureOutput();
    await AssistantsListConversations.run([
      'MYASSISTANT', '--context-id', 'CTX', '--page-size', '20', '--page-index', '2',
    ]);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ conversations: [] });
  });

  test('missing --context-id → oclif required-flag error', async () => {
    captured = captureOutput();
    await expect(AssistantsListConversations.run(['MYASSISTANT'])).rejects.toThrow();
  });

  test('URL-encodes assistantID and contextID with special characters', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const assistantId = 'MY ASSISTANT';
    const ctx = 'MYORG-WORK!M-123';
    expect(encodeURIComponent(assistantId)).toContain('%20');
    const scope = nock('https://pega.example.com')
      .get(`/prweb/api/application/v2/assistants/${encodeURIComponent(assistantId)}/conversations`)
      .query({ contextID: ctx })  // nock query() URL-encodes
      .reply(200, { conversations: [] });

    captured = captureOutput();
    await AssistantsListConversations.run([assistantId, '--context-id', ctx]);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ conversations: [] });
  });
});
