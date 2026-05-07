import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { createPegaApiClient, type LoggedRequest, EXTENDED_TIMEOUT_MS } from '../../src/lib/api-client.js';
import { mockMultipartUpload } from '../helpers/mock-pega-api.js';

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

  test('put sends PUT with body and Content-Type', async () => {
    nock('https://pega.example.com', {
      reqheaders: { 'content-type': 'application/json' },
    })
      .put('/prweb/api/application/v2/cases/A/stages/Stage2', { foo: 'bar' })
      .reply(200, { ok: true });

    const c = createPegaApiClient({
      baseUrl: 'https://pega.example.com',
      tokenProvider: async () => 't',
    });
    const result = await c.put('/cases/A/stages/Stage2', { foo: 'bar' });
    expect(result).toEqual({ ok: true });
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
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    const realFetch = global.fetch;
    global.fetch = ((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      })) as typeof fetch;

    try {
      const promise = client().get('/cases/X', { timeoutMs: 100 });
      // Attach the rejection handler BEFORE advancing timers to avoid unhandled rejection.
      const assertion = expect(promise).rejects.toMatchObject({ code: 'TIMEOUT' });
      // Yield to the microtask queue so tokenProvider() resolves inside doRequest
      // and the setTimeout for the abort is registered before we advance fake time.
      await Promise.resolve();
      jest.advanceTimersByTime(150);
      await assertion;
    } finally {
      global.fetch = realFetch;
      jest.useRealTimers();
    }
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

  test('EXTENDED_TIMEOUT_MS is exported and equals 45000', () => {
    expect(EXTENDED_TIMEOUT_MS).toBe(45_000);
  });

  test('onVerbose callback receives redacted Authorization header', async () => {
    nock('https://pega.example.com', {
      reqheaders: { authorization: /^Bearer .+/ },
    })
      .get('/prweb/api/application/v2/cases/A')
      .reply(200, { id: 'A' });

    const onVerbose = jest.fn();
    const c = createPegaApiClient({
      baseUrl: 'https://pega.example.com',
      tokenProvider: async () => 'real-token-xyz',
      onVerbose,
    });

    await c.get('/cases/A');

    expect(onVerbose).toHaveBeenCalledTimes(1);
    const req = onVerbose.mock.calls[0]![0] as LoggedRequest;
    expect(req.headers.Authorization ?? req.headers.authorization).toBe('[REDACTED]');
    // The real bearer token must never be observable through the callback.
    const stringified = JSON.stringify(req.headers);
    expect(stringified).not.toContain('real-token-xyz');
  });
});

describe('uploadMultipart', () => {
  const baseUrl = 'https://pega.example.com';
  const tokenProvider = async () => 'test-token';

  beforeEach(() => {
    if (!nock.isActive()) nock.activate();
  });
  afterEach(() => {
    nock.cleanAll();
  });

  test('happy path — POSTs FormData and returns parsed JSON', async () => {
    mockMultipartUpload(baseUrl, '/attachments/upload', 201, { ID: 'temp-uuid-123' });
    const c = createPegaApiClient({ baseUrl, tokenProvider });
    const fd = new FormData();
    fd.append('file', new Blob(['hello']), 'hello.txt');
    const res = await c.uploadMultipart<{ ID: string }>('/attachments/upload', fd);
    expect(res).toEqual({ ID: 'temp-uuid-123' });
  });

  test('does not set Content-Type on the request (runtime adds boundary)', async () => {
    let capturedHeaders: Record<string, string | string[] | undefined> = {};
    nock(baseUrl)
      .post('/prweb/api/application/v2/attachments/upload')
      .reply(function () {
        capturedHeaders = this.req.headers as Record<string, string | string[] | undefined>;
        return [201, { ID: 'x' }];
      });
    const c = createPegaApiClient({ baseUrl, tokenProvider });
    const fd = new FormData();
    fd.append('file', new Blob(['x']));
    await c.uploadMultipart('/attachments/upload', fd);
    // Either no Content-Type at all (preferred) OR runtime-set multipart/form-data with boundary.
    const ct = capturedHeaders['content-type'];
    if (ct !== undefined) {
      const ctStr = Array.isArray(ct) ? ct.join(',') : ct;
      expect(ctStr).toMatch(/^multipart\/form-data; boundary=/);
    }
  });

  test('5xx response → normalized error', async () => {
    nock(baseUrl)
      .post('/prweb/api/application/v2/attachments/upload')
      .reply(500, { errors: [{ message: 'internal error' }] });
    const c = createPegaApiClient({ baseUrl, tokenProvider });
    const fd = new FormData();
    fd.append('file', new Blob(['x']));
    await expect(c.uploadMultipart('/attachments/upload', fd)).rejects.toMatchObject({
      httpStatus: 500,
    });
  });
});
