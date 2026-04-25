import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { createPegaApiClient } from '../../src/lib/api-client.js';

const BASE = 'https://pega.example.com';
const V2 = `${BASE}/prweb/api/application/v2`;

function client(tokenValue = 'test-token') {
  return createPegaApiClient({
    baseUrl: BASE,
    tokenProvider: async () => tokenValue,
  });
}

beforeEach(() => {
  if (!nock.isActive()) nock.activate();
});

afterEach(() => {
  nock.cleanAll();
});

describe('createPegaApiClient', () => {
  test('GET injects Authorization: Bearer header', async () => {
    nock(BASE)
      .get('/prweb/api/application/v2/cases/C-1')
      .matchHeader('Authorization', 'Bearer test-token')
      .matchHeader('Accept', 'application/json')
      .matchHeader('x-origin-channel', 'Web')
      .reply(200, { id: 'C-1' });

    const c = client();
    const res = await c.get<{ id: string }>('/cases/C-1');
    expect(res).toEqual({ id: 'C-1' });
  });

  test('POST JSON-encodes body and sets Content-Type', async () => {
    nock(BASE)
      .post('/prweb/api/application/v2/cases', { caseTypeID: 'X' })
      .matchHeader('Content-Type', 'application/json')
      .reply(201, { id: 'NEW' });

    const res = await client().post<{ id: string }>('/cases', { caseTypeID: 'X' });
    expect(res).toEqual({ id: 'NEW' });
  });

  test('PATCH with extraHeaders merges If-Match', async () => {
    nock(BASE)
      .patch('/prweb/api/application/v2/assignments/A-1/actions/Act', { content: { x: 1 } })
      .matchHeader('If-Match', 'etag-xyz')
      .reply(200, { updated: true });

    const res = await client().patch('/assignments/A-1/actions/Act', { content: { x: 1 } }, {
      extraHeaders: { 'If-Match': 'etag-xyz' },
    });
    expect(res).toEqual({ updated: true });
  });

  test('DELETE with empty response body resolves to empty object', async () => {
    nock(BASE)
      .delete('/prweb/api/application/v2/cases/C-1')
      .reply(204);

    const res = await client().delete<Record<string, unknown>>('/cases/C-1');
    expect(res).toEqual({});
  });

  test('exposes ETag from response when includeResponse option requested', async () => {
    nock(BASE)
      .get('/prweb/api/application/v2/assignments/A-1')
      .reply(200, { id: 'A-1' }, { ETag: '"abc123"' });

    const res = await client().getWithMeta<{ id: string }>('/assignments/A-1');
    expect(res.data).toEqual({ id: 'A-1' });
    expect(res.eTag).toBe('"abc123"');
  });

  test('404 throws NOT_FOUND NormalizedError', async () => {
    nock(BASE)
      .get('/prweb/api/application/v2/cases/MISSING')
      .reply(404, { localizedValue: 'Case not found', errors: [{ ID: 'ERR-1' }] });

    await expect(client().get('/cases/MISSING')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      httpStatus: 404,
      pegaErrorId: 'ERR-1',
    });
  });

  test('401 throws UNAUTHORIZED', async () => {
    nock(BASE).get('/prweb/api/application/v2/cases/X').reply(401, {});
    await expect(client().get('/cases/X')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('429 throws RATE_LIMITED', async () => {
    nock(BASE).get('/prweb/api/application/v2/cases/X').reply(429, {});
    await expect(client().get('/cases/X')).rejects.toMatchObject({ code: 'RATE_LIMITED' });
  });

  test('network error throws NETWORK_ERROR', async () => {
    nock(BASE).get('/prweb/api/application/v2/cases/X').replyWithError('socket hang up');
    await expect(client().get('/cases/X')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  test('timeout throws TIMEOUT', async () => {
    nock(BASE)
      .get('/prweb/api/application/v2/cases/X')
      .delay(100)
      .reply(200, {});
    await expect(
      client().get('/cases/X', { timeoutMs: 10 }),
    ).rejects.toMatchObject({ code: 'TIMEOUT' });
  });

  test('invokes onVerbose with request and response details', async () => {
    nock(BASE)
      .get('/prweb/api/application/v2/cases/C-1')
      .reply(200, { id: 'C-1' });

    const calls: Array<{ req: unknown; res: unknown }> = [];
    const c = createPegaApiClient({
      baseUrl: BASE,
      tokenProvider: async () => 'tok',
      onVerbose: (req, res) => calls.push({ req, res }),
    });
    await c.get('/cases/C-1');
    expect(calls).toHaveLength(1);
    expect(calls[0]!.req).toMatchObject({ method: 'GET', url: `${V2}/cases/C-1` });
    expect(calls[0]!.res).toMatchObject({ status: 200 });
  });

  test('extraHeaders override default headers', async () => {
    nock(BASE)
      .get('/prweb/api/application/v2/cases/X')
      .matchHeader('x-origin-channel', 'Mobile')
      .reply(200, {});
    await client().get('/cases/X', { extraHeaders: { 'x-origin-channel': 'Mobile' } });
  });
});
