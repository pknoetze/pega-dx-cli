import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import AuthProfilesGet from '../../../src/commands/auth-profiles/get.js';

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

describe('auth-profiles get', () => {
  test('happy path (no gadget-id) returns profile details', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .get('/prweb/api/application/v2/authentication-profiles/MyProfile')
      .reply(200, { name: 'MyProfile' });

    captured = captureOutput();
    await AuthProfilesGet.run(['MyProfile']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ name: 'MyProfile' });
  });

  test('--gadget-id appends ?gadgetId= to the URL', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .get('/prweb/api/application/v2/authentication-profiles/MyProfile')
      .query({ gadgetId: 'gadget123' })
      .reply(200, { name: 'MyProfile' });

    captured = captureOutput();
    await AuthProfilesGet.run(['MyProfile', '--gadget-id', 'gadget123']);
    expect(scope.isDone()).toBe(true);
  });

  test('URL-encodes authProfileName', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const profileName = 'My Profile/With Slash';
    const scope = nock('https://pega.example.com')
      .get(`/prweb/api/application/v2/authentication-profiles/${encodeURIComponent(profileName)}`)
      .reply(200, { name: profileName });

    captured = captureOutput();
    await AuthProfilesGet.run([profileName]);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run outputs method and URL without making a request', async () => {
    captured = captureOutput();
    await AuthProfilesGet.run(['MyProfile', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('GET');
    expect(out.url).toBe('https://pega.example.com/prweb/api/application/v2/authentication-profiles/MyProfile');
  });

  test('404 emits structured error and exits 1', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/authentication-profiles/MISSING')
      .reply(404, { localizedValue: 'Not found' });

    captured = captureOutput();
    await expect(AuthProfilesGet.run(['MISSING'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
