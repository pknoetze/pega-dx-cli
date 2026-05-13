import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import SocialListLikes from '../../../src/commands/social/list-likes.js';

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

describe('social list-likes', () => {
  test('happy path returns likes', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .get('/prweb/api/application/v2/messages/MSG-1/likes')
      .reply(200, { likes: [] });

    captured = captureOutput();
    await SocialListLikes.run(['MSG-1']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ likes: [] });
  });

  test('URL-encodes messageID', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const messageID = 'MSG with space';
    const scope = nock('https://pega.example.com')
      .get(`/prweb/api/application/v2/messages/${encodeURIComponent(messageID)}/likes`)
      .reply(200, {});

    captured = captureOutput();
    await SocialListLikes.run([messageID]);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run emits GET with URL ending in /likes', async () => {
    captured = captureOutput();
    await SocialListLikes.run(['MSG-1', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toMatch(/\/likes$/);
  });

  test('404 emits structured error', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/messages/MISSING/likes')
      .reply(404, { localizedValue: 'Not found' });

    captured = captureOutput();
    await expect(SocialListLikes.run(['MISSING'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
