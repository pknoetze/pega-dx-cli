import nock from 'nock';

export function mockOAuthSuccess(
  baseUrl: string,
  token = 'test-token',
  expiresIn = 3600,
): nock.Scope {
  return nock(baseUrl)
    .post('/prweb/PRRestService/oauth2/v1/token', 'grant_type=client_credentials')
    .reply(200, { access_token: token, expires_in: expiresIn, token_type: 'Bearer' });
}

export function mockOAuthFailure(baseUrl: string, status = 401, body: Record<string, unknown> = { error: 'invalid_client' }): nock.Scope {
  return nock(baseUrl).post('/prweb/PRRestService/oauth2/v1/token').reply(status, body);
}

export function mockV2(baseUrl: string): nock.Scope {
  return nock(baseUrl);
}

export function cleanupNock(): void {
  nock.cleanAll();
  nock.restore();
  if (!nock.isActive()) nock.activate();
}
