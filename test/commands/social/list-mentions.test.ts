import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import SocialListMentions from '../../../src/commands/social/list-mentions.js';

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

describe('social list-mentions', () => {
  test('happy path with required --mentions-type returns mentions', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .get('/prweb/api/application/v2/mentions')
      .query({ mentionsType: 'Operators' })
      .reply(200, { mentions: [] });

    captured = captureOutput();
    await SocialListMentions.run(['--mentions-type', 'Operators']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ mentions: [] });
  });

  test('all optional params forwarded', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .get('/prweb/api/application/v2/mentions')
      .query({ mentionsType: 'Operators', context: 'MYORG-WORK!M-1', searchFor: 'jdoe', listSize: '10' })
      .reply(200, {});

    captured = captureOutput();
    await SocialListMentions.run([
      '--mentions-type', 'Operators',
      '--context', 'MYORG-WORK!M-1',
      '--search-for', 'jdoe',
      '--list-size', '10',
    ]);
    expect(scope.isDone()).toBe(true);
  });

  test('missing --mentions-type rejects before network', async () => {
    captured = captureOutput();
    await expect(SocialListMentions.run([])).rejects.toThrow();
  });

  test('--dry-run emits GET with correct URL', async () => {
    captured = captureOutput();
    await SocialListMentions.run(['--mentions-type', 'Operators', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toContain('/prweb/api/application/v2/mentions');
    expect(out.url).toContain('mentionsType=Operators');
  });

  test('404 emits structured error', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/mentions')
      .query(true)
      .reply(404, { localizedValue: 'Not found' });

    captured = captureOutput();
    await expect(SocialListMentions.run(['--mentions-type', 'Operators'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
