import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import SocialGetFeed from '../../../src/commands/social/get-feed.js';

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

describe('social get-feed', () => {
  test('happy path with required --filter-for returns feed', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .get('/prweb/api/application/v2/feeds/F-1')
      .query({ filterFor: 'CTX-1' })
      .reply(200, { feedID: 'F-1' });

    captured = captureOutput();
    await SocialGetFeed.run(['F-1', '--filter-for', 'CTX-1']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ feedID: 'F-1' });
  });

  test('all optional query params forwarded', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .get('/prweb/api/application/v2/feeds/F-1')
      .query({
        filterFor: 'CTX-1',
        olderThan: '2024-01-01',
        pageSize: '10',
        feedClass: 'Work-Pulse',
        filterBy: 'Pulse,Case',
      })
      .reply(200, { feedID: 'F-1' });

    captured = captureOutput();
    await SocialGetFeed.run([
      'F-1',
      '--filter-for', 'CTX-1',
      '--older-than', '2024-01-01',
      '--page-size', '10',
      '--feed-class', 'Work-Pulse',
      '--filter-by', 'Pulse,Case',
    ]);
    expect(scope.isDone()).toBe(true);
  });

  test('URL-encodes feedID', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const feedID = 'F with space';
    const scope = nock('https://pega.example.com')
      .get(`/prweb/api/application/v2/feeds/${encodeURIComponent(feedID)}`)
      .query({ filterFor: 'CTX-1' })
      .reply(200, {});

    captured = captureOutput();
    await SocialGetFeed.run([feedID, '--filter-for', 'CTX-1']);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run emits GET with correct URL including filterFor', async () => {
    captured = captureOutput();
    await SocialGetFeed.run(['F-1', '--filter-for', 'CTX-1', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toContain('/prweb/api/application/v2/feeds/F-1');
    expect(out.url).toContain('filterFor=CTX-1');
  });

  test('missing --filter-for rejects before network', async () => {
    captured = captureOutput();
    await expect(SocialGetFeed.run(['F-1'])).rejects.toThrow();
  });

  test('404 emits structured error', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/feeds/MISSING')
      .query(true)
      .reply(404, { localizedValue: 'Not found' });

    captured = captureOutput();
    await expect(SocialGetFeed.run(['MISSING', '--filter-for', 'CTX-1'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
