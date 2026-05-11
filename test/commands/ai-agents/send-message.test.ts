import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs, seedFile } from '../../helpers/mock-filesystem.js';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: AiAgentsSendMessage } = await import('../../../src/commands/ai-agents/send-message.js');

let captured: CapturedOutput;
let origEmitWarning: typeof process.emitWarning;

beforeEach(() => {
  resetMockFs();
  process.env.HOME = '/home/test';
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
  delete process.env.HOME;
});

describe('ai-agents send-message', () => {
  test('--request only → body is exactly {Request: "..."} with capital R', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/ai-agents/MYAGENT/conversations/PXCONV-1', { Request: 'hello' })
      .reply(200, { response: 'hi back', messageID: 'MSG-1' });

    captured = captureOutput();
    await AiAgentsSendMessage.run(['MYAGENT', '--conversation', 'PXCONV-1', '--request', 'hello']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ response: 'hi back', messageID: 'MSG-1' });
  });

  test('all flags compose body with capitalized Request/Attachments + lowercase activeChannel fields', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const expectedBody = {
      Request: 'hello',
      Attachments: [{ type: 'File', ID: 'A1', category: 'File' }],
      activeChannel: 'Web',
      activeChannelID: 'CH1',
    };
    const scope = nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/ai-agents/MYAGENT/conversations/PXCONV-1', expectedBody)
      .reply(200, { messageID: 'MSG-2' });

    captured = captureOutput();
    await AiAgentsSendMessage.run([
      'MYAGENT',
      '--conversation', 'PXCONV-1',
      '--request', 'hello',
      '--attachments', JSON.stringify([{ type: 'File', ID: 'A1', category: 'File' }]),
      '--active-channel', 'Web',
      '--active-channel-id', 'CH1',
    ]);
    expect(scope.isDone()).toBe(true);
  });

  test('--attachments @file.json reads file via parseDataInput', async () => {
    mockOAuthSuccess('https://pega.example.com');
    seedFile('/tmp/atts.json', JSON.stringify([{ type: 'URL', ID: 'A2' }]));
    const scope = nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/ai-agents/MYAGENT/conversations/PXCONV-1', {
        Request: 'hello',
        Attachments: [{ type: 'URL', ID: 'A2' }],
      })
      .reply(200, {});

    captured = captureOutput();
    await AiAgentsSendMessage.run([
      'MYAGENT', '--conversation', 'PXCONV-1', '--request', 'hello',
      '--attachments', '@/tmp/atts.json',
    ]);
    expect(scope.isDone()).toBe(true);
  });

  test('malformed --attachments JSON → INVALID_ARGS', async () => {
    captured = captureOutput();
    await expect(
      AiAgentsSendMessage.run([
        'MYAGENT', '--conversation', 'PXCONV-1', '--request', 'hello',
        '--attachments', 'not-json{',
      ]),
    ).rejects.toThrow();
    const err = parseFirstJson(captured.stderr);
    expect((err as { code: string }).code).toBe('INVALID_ARGS');
  });

  test('--dry-run emits PATCH method with correct URL and capitalized body keys', async () => {
    captured = captureOutput();
    await AiAgentsSendMessage.run([
      'MYAGENT', '--conversation', 'PXCONV-1', '--request', 'hello', '--dry-run',
    ]);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('PATCH');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/ai-agents/MYAGENT/conversations/PXCONV-1');
    expect(out.body).toEqual({ Request: 'hello' });
  });

  test('5xx response surfaces normalized error', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .patch('/prweb/api/application/v2/ai-agents/MYAGENT/conversations/PXCONV-1')
      .reply(500, { errorClassification: 'Execution error', localizedValue: 'boom' });

    captured = captureOutput();
    await expect(
      AiAgentsSendMessage.run(['MYAGENT', '--conversation', 'PXCONV-1', '--request', 'hello']),
    ).rejects.toThrow();
    const err = parseFirstJson(captured.stderr);
    expect((err as { httpStatus: number }).httpStatus).toBe(500);
  });
});
