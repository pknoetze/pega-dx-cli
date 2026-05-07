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

export function mockMultipartUpload(
  baseUrl: string,
  path: string,
  status: number,
  response: Record<string, unknown>,
): nock.Scope {
  // nock matches multipart by default if no body matcher is provided; the
  // request body is opaque (binary multipart), but the path + method + status
  // are the verifiable contract.
  return nock(baseUrl)
    .post(`/prweb/api/application/v2${path}`)
    .reply(status, response);
}

export function cleanupNock(): void {
  nock.cleanAll();
  nock.restore();
  if (!nock.isActive()) nock.activate();
}
