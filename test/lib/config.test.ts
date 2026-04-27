import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs, seedFile, readMockFile, mockFileStat } from '../helpers/mock-filesystem.js';
import { mockOAuthSuccess, mockOAuthFailure } from '../helpers/mock-pega-api.js';

const HOME = '/home/test';
const CONFIG_PATH = `${HOME}/.pega-cli/config.json`;

function tokenPathFor(profile: string): string {
  return `${HOME}/.pega-cli/token.${profile}.json`;
}

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});
jest.unstable_mockModule('node:fs/promises', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs.promises, default: memfs.fs.promises };
});

const { getConfig, getToken, clearToken } = await import('../../src/lib/config.js');

beforeEach(() => {
  resetMockFs();
  process.env.HOME = HOME;
  delete process.env.PEGA_BASE_URL;
  delete process.env.PEGA_CLIENT_ID;
  delete process.env.PEGA_CLIENT_SECRET;
  delete process.env.PEGA_NO_CACHE;
  if (!nock.isActive()) nock.activate();
});

afterEach(() => {
  nock.cleanAll();
});

describe('getConfig', () => {
  test('reads from environment variables when set', () => {
    process.env.PEGA_BASE_URL = 'https://pega.example.com';
    process.env.PEGA_CLIENT_ID = 'abc';
    process.env.PEGA_CLIENT_SECRET = 'xyz';
    const cfg = getConfig('default');
    expect(cfg).toEqual({
      baseUrl: 'https://pega.example.com',
      clientId: 'abc',
      clientSecret: 'xyz',
      profile: 'default',
    });
  });

  test('reads from config file when env vars absent', () => {
    seedFile(
      CONFIG_PATH,
      JSON.stringify({
        default: { baseUrl: 'https://pega.example.com', clientId: 'fromfile', clientSecret: 's' },
      }),
    );
    const cfg = getConfig('default');
    expect(cfg.clientId).toBe('fromfile');
  });

  test('env vars take precedence over file', () => {
    seedFile(
      CONFIG_PATH,
      JSON.stringify({
        default: { baseUrl: 'https://file.pega', clientId: 'F', clientSecret: 'F' },
      }),
    );
    process.env.PEGA_BASE_URL = 'https://env.pega';
    process.env.PEGA_CLIENT_ID = 'E';
    process.env.PEGA_CLIENT_SECRET = 'E';
    const cfg = getConfig('default');
    expect(cfg.baseUrl).toBe('https://env.pega');
    expect(cfg.clientId).toBe('E');
  });

  test('strips /prweb and suffix from baseUrl', () => {
    process.env.PEGA_BASE_URL = 'https://pega.example.com/prweb/app';
    process.env.PEGA_CLIENT_ID = 'a';
    process.env.PEGA_CLIENT_SECRET = 'b';
    expect(getConfig('default').baseUrl).toBe('https://pega.example.com');
  });

  test('throws INVALID_CONFIG when baseUrl missing', () => {
    expect(() => getConfig('default')).toThrow(
      expect.objectContaining({ code: 'INVALID_CONFIG' }),
    );
  });

  test('throws INVALID_CONFIG when clientId missing', () => {
    process.env.PEGA_BASE_URL = 'https://p';
    process.env.PEGA_CLIENT_SECRET = 'x';
    expect(() => getConfig('default')).toThrow(
      expect.objectContaining({ code: 'INVALID_CONFIG' }),
    );
  });

  test('throws INVALID_CONFIG when clientSecret missing', () => {
    process.env.PEGA_BASE_URL = 'https://p';
    process.env.PEGA_CLIENT_ID = 'x';
    expect(() => getConfig('default')).toThrow(
      expect.objectContaining({ code: 'INVALID_CONFIG' }),
    );
  });

  test('reads named profile from config file', () => {
    seedFile(
      CONFIG_PATH,
      JSON.stringify({
        prod: { baseUrl: 'https://prod.pega', clientId: 'P', clientSecret: 'P' },
      }),
    );
    const cfg = getConfig('prod');
    expect(cfg.baseUrl).toBe('https://prod.pega');
    expect(cfg.profile).toBe('prod');
  });

  test('old { profiles: { ... } } shape produces INVALID_CONFIG', () => {
    delete process.env.PEGA_BASE_URL;
    delete process.env.PEGA_CLIENT_ID;
    delete process.env.PEGA_CLIENT_SECRET;
    seedFile(
      CONFIG_PATH,
      JSON.stringify({
        profiles: {
          default: { baseUrl: 'https://pega.example.com', clientId: 'fromfile', clientSecret: 's' },
        },
      }),
    );
    expect(() => getConfig('default')).toThrow(
      expect.objectContaining({ code: 'INVALID_CONFIG' }),
    );
  });
});

describe('getToken', () => {
  beforeEach(() => {
    process.env.PEGA_BASE_URL = 'https://pega.example.com';
    process.env.PEGA_CLIENT_ID = 'id';
    process.env.PEGA_CLIENT_SECRET = 'secret';
  });

  test('returns cached token when still valid', async () => {
    seedFile(
      tokenPathFor('default'),
      JSON.stringify({
        accessToken: 'cached-t',
        expiresAt: new Date(Date.now() + 600_000).toISOString(),
      }),
    );
    const t = await getToken({ noCache: false, profile: 'default' });
    expect(t.accessToken).toBe('cached-t');
  });

  test('fetches fresh token when cache expired', async () => {
    seedFile(
      tokenPathFor('default'),
      JSON.stringify({
        accessToken: 'old',
        expiresAt: new Date(Date.now() - 10_000).toISOString(),
      }),
    );
    mockOAuthSuccess('https://pega.example.com', 'new-token');
    const t = await getToken({ noCache: false, profile: 'default' });
    expect(t.accessToken).toBe('new-token');
  });

  test('refreshes when less than 60 seconds remain', async () => {
    seedFile(
      tokenPathFor('default'),
      JSON.stringify({
        accessToken: 'almost-expired',
        expiresAt: new Date(Date.now() + 30_000).toISOString(),
      }),
    );
    mockOAuthSuccess('https://pega.example.com', 'refreshed');
    const t = await getToken({ noCache: false, profile: 'default' });
    expect(t.accessToken).toBe('refreshed');
  });

  test('POSTs OAuth with Basic auth and grant_type=client_credentials', async () => {
    const scope = nock('https://pega.example.com')
      .post('/prweb/PRRestService/oauth2/v1/token', 'grant_type=client_credentials')
      .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
      .matchHeader('Authorization', `Basic ${Buffer.from('id:secret').toString('base64')}`)
      .reply(200, { access_token: 'hello', expires_in: 3600 });

    const t = await getToken({ noCache: true, profile: 'default' });
    expect(t.accessToken).toBe('hello');
    expect(scope.isDone()).toBe(true);
  });

  test('writes token file with 0600 mode on Unix', async () => {
    mockOAuthSuccess('https://pega.example.com', 'stored');
    await getToken({ noCache: false, profile: 'default' });
    const stat = mockFileStat(tokenPathFor('default'));
    expect(stat).not.toBeNull();
    if (process.platform !== 'win32') {
      expect(stat!.mode & 0o777).toBe(0o600);
    }
  });

  test('noCache=true bypasses token file reads', async () => {
    seedFile(
      tokenPathFor('default'),
      JSON.stringify({
        accessToken: 'cached',
        expiresAt: new Date(Date.now() + 600_000).toISOString(),
      }),
    );
    mockOAuthSuccess('https://pega.example.com', 'fresh');
    const t = await getToken({ noCache: true, profile: 'default' });
    expect(t.accessToken).toBe('fresh');
  });

  test('noCache=true never writes token file', async () => {
    mockOAuthSuccess('https://pega.example.com', 'no-write');
    await getToken({ noCache: true, profile: 'default' });
    const stat = mockFileStat(tokenPathFor('default'));
    expect(stat).toBeNull();
  });

  test('PEGA_NO_CACHE=true env forces noCache behavior', async () => {
    process.env.PEGA_NO_CACHE = 'true';
    mockOAuthSuccess('https://pega.example.com', 'env-no-cache');
    await getToken({ noCache: false, profile: 'default' });
    const stat = mockFileStat(tokenPathFor('default'));
    expect(stat).toBeNull();
  });

  test('OAuth failure normalizes to NormalizedError', async () => {
    mockOAuthFailure('https://pega.example.com', 401, { error: 'invalid_client' });
    await expect(getToken({ noCache: true, profile: 'default' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      httpStatus: 401,
    });
  });

  test('forceFresh=true ignores valid cache but writes result', async () => {
    seedFile(
      tokenPathFor('default'),
      JSON.stringify({
        accessToken: 'cached',
        expiresAt: new Date(Date.now() + 600_000).toISOString(),
      }),
    );
    mockOAuthSuccess('https://pega.example.com', 'fresh');
    const t = await getToken({ noCache: false, profile: 'default', forceFresh: true });
    expect(t.accessToken).toBe('fresh');
    const stored = JSON.parse(readMockFile(tokenPathFor('default')));
    expect(stored.accessToken).toBe('fresh');
  });

  test('defaults expires_in to 3600s when missing', async () => {
    nock('https://pega.example.com')
      .post('/prweb/PRRestService/oauth2/v1/token')
      .reply(200, { access_token: 'no-expiry' });
    const t = await getToken({ noCache: true, profile: 'default' });
    const expiresAt = new Date(t.expiresAt).getTime();
    const diff = expiresAt - Date.now();
    expect(diff).toBeGreaterThan(3500_000);
    expect(diff).toBeLessThan(3700_000);
  });

  test('OAuth 200 with missing access_token throws OAUTH_INVALID_RESPONSE', async () => {
    nock('https://pega.example.com')
      .post('/prweb/PRRestService/oauth2/v1/token')
      .reply(200, { token_type: 'Bearer' });
    await expect(getToken({ noCache: true, profile: 'default' })).rejects.toMatchObject({
      code: 'OAUTH_INVALID_RESPONSE',
    });
  });

  test('network failure normalizes to NETWORK_ERROR', async () => {
    nock('https://pega.example.com')
      .post('/prweb/PRRestService/oauth2/v1/token')
      .replyWithError('connection refused');
    await expect(getToken({ noCache: true, profile: 'default' })).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  test('forceFresh=true + noCache=true skips both read and write', async () => {
    seedFile(
      tokenPathFor('default'),
      JSON.stringify({
        accessToken: 'cached',
        expiresAt: new Date(Date.now() + 600_000).toISOString(),
      }),
    );
    mockOAuthSuccess('https://pega.example.com', 'fresh-and-uncached');
    const t = await getToken({ noCache: true, profile: 'default', forceFresh: true });
    expect(t.accessToken).toBe('fresh-and-uncached');
    // Token file should still contain the OLD cached value (no write occurred).
    const stored = JSON.parse(readMockFile(tokenPathFor('default')));
    expect(stored.accessToken).toBe('cached');
  });

  test('getToken --profile staging writes only token.staging.json', async () => {
    process.env.PEGA_CLIENT_SECRET = 's';
    delete process.env.PEGA_NO_CACHE;
    mockOAuthSuccess('https://pega.example.com');

    await getToken({ noCache: false, profile: 'staging' });

    // The staging file exists:
    expect(mockFileStat(tokenPathFor('staging'))).not.toBeNull();
    // The default file does NOT exist (we never logged in to default):
    expect(mockFileStat(tokenPathFor('default'))).toBeNull();
  });

  test('legacy token.json is ignored on read', async () => {
    process.env.PEGA_CLIENT_SECRET = 's';
    delete process.env.PEGA_NO_CACHE;
    mockOAuthSuccess('https://pega.example.com');

    // Plant a legacy token.json with cached token for 'default' (old wrapped shape).
    seedFile(
      `${HOME}/.pega-cli/token.json`,
      JSON.stringify({
        default: {
          accessToken: 'legacy-cached',
          expiresAt: new Date(Date.now() + 600_000).toISOString(),
        },
      }),
    );

    const token = await getToken({ noCache: false, profile: 'default' });
    // Legacy cache must NOT be used — an OAuth round-trip produces a fresh token.
    expect(token.accessToken).not.toBe('legacy-cached');
  });

  test('per-profile token file has 0600 mode on Unix (Linux/macOS)', async () => {
    if (process.platform === 'win32') return;
    process.env.PEGA_CLIENT_SECRET = 's';
    delete process.env.PEGA_NO_CACHE;
    mockOAuthSuccess('https://pega.example.com');

    await getToken({ noCache: false, profile: 'default' });

    const stat = mockFileStat(tokenPathFor('default'));
    expect(stat).not.toBeNull();
    expect(stat!.mode & 0o777).toBe(0o600);
  });
});

describe('clearToken', () => {
  beforeEach(() => {
    process.env.PEGA_BASE_URL = 'https://p';
    process.env.PEGA_CLIENT_ID = 'i';
    process.env.PEGA_CLIENT_SECRET = 's';
  });

  test('removes per-profile token file and leaves others intact', () => {
    seedFile(
      tokenPathFor('default'),
      JSON.stringify({ accessToken: 'x', expiresAt: '2099-01-01T00:00:00Z' }),
    );
    seedFile(
      tokenPathFor('prod'),
      JSON.stringify({ accessToken: 'y', expiresAt: '2099-01-01T00:00:00Z' }),
    );
    clearToken('default');
    // default file is gone:
    expect(mockFileStat(tokenPathFor('default'))).toBeNull();
    // prod file is untouched:
    const stored = JSON.parse(readMockFile(tokenPathFor('prod')));
    expect(stored.accessToken).toBe('y');
  });

  test('no-op when token file does not exist', () => {
    expect(() => clearToken('default')).not.toThrow();
  });

  test('clearToken is ENOENT-tolerant for unknown profile', () => {
    expect(() => clearToken('nonexistent')).not.toThrow();
  });
});
