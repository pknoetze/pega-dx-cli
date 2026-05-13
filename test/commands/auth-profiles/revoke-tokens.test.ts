import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import { captureOutput, parseFirstJson, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import AuthProfilesRevokeTokens from '../../../src/commands/auth-profiles/revoke-tokens.js';

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

describe('auth-profiles revoke-tokens', () => {
  test('happy path DELETEs /authentication-profiles/{name}/user-tokens', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .delete('/prweb/api/application/v2/authentication-profiles/MyProfile/user-tokens')
      .reply(200, { revoked: true });

    captured = captureOutput();
    await AuthProfilesRevokeTokens.run(['MyProfile']);
    expect(scope.isDone()).toBe(true);
    expect(JSON.parse(captured.stdout.join(''))).toEqual({ revoked: true });
  });

  test('--gadget-id appends ?gadgetId= to the URL', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const scope = nock('https://pega.example.com')
      .delete('/prweb/api/application/v2/authentication-profiles/MyProfile/user-tokens')
      .query({ gadgetId: 'gadget123' })
      .reply(200, { revoked: true });

    captured = captureOutput();
    await AuthProfilesRevokeTokens.run(['MyProfile', '--gadget-id', 'gadget123']);
    expect(scope.isDone()).toBe(true);
  });

  test('URL-encodes authProfileName', async () => {
    mockOAuthSuccess('https://pega.example.com');
    const profileName = 'My Profile/With Slash';
    const scope = nock('https://pega.example.com')
      .delete(`/prweb/api/application/v2/authentication-profiles/${encodeURIComponent(profileName)}/user-tokens`)
      .reply(200, { revoked: true });

    captured = captureOutput();
    await AuthProfilesRevokeTokens.run([profileName]);
    expect(scope.isDone()).toBe(true);
  });

  test('--dry-run outputs DELETE method and URL ending in /user-tokens', async () => {
    captured = captureOutput();
    await AuthProfilesRevokeTokens.run(['MyProfile', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.method).toBe('DELETE');
    expect(out.url).toMatch(/\/authentication-profiles\/MyProfile\/user-tokens$/);
  });

  test('404 emits structured error and exits 1', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .delete('/prweb/api/application/v2/authentication-profiles/MISSING/user-tokens')
      .reply(404, { localizedValue: 'Not found' });

    captured = captureOutput();
    await expect(AuthProfilesRevokeTokens.run(['MISSING'])).rejects.toThrow();
    const err = parseFirstJson(captured.stderr) as Record<string, unknown>;
    expect(err).toMatchObject({ error: true, code: 'NOT_FOUND', httpStatus: 404 });
  });
});
