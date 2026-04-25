import { describe, test, expect } from '@jest/globals';
import { fromHttpResponse, fromNetworkError, isNormalizedError } from '../../src/lib/errors.js';

function mockResponse(status: number, statusText = ''): Response {
  return new Response(null, { status, statusText });
}

describe('fromHttpResponse', () => {
  test('maps 400 → BAD_REQUEST', () => {
    const err = fromHttpResponse(mockResponse(400), { localizedValue: 'bad stuff' });
    expect(err).toEqual({
      code: 'BAD_REQUEST',
      message: 'bad stuff',
      httpStatus: 400,
    });
  });

  test('maps 401 → UNAUTHORIZED with fallback message from errors[0]', () => {
    const err = fromHttpResponse(mockResponse(401, 'Unauthorized'), {
      errors: [{ message: 'token expired' }],
    });
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.message).toBe('token expired');
  });

  test('maps 404 → NOT_FOUND', () => {
    const err = fromHttpResponse(mockResponse(404), { localizedValue: 'case not found' });
    expect(err.code).toBe('NOT_FOUND');
    expect(err.httpStatus).toBe(404);
  });

  test('maps 408 → TIMEOUT', () => {
    const err = fromHttpResponse(mockResponse(408), {});
    expect(err.code).toBe('TIMEOUT');
  });

  test('maps 409 → CONFLICT', () => {
    expect(fromHttpResponse(mockResponse(409), {}).code).toBe('CONFLICT');
  });

  test('maps 412 → PRECONDITION_FAILED', () => {
    expect(fromHttpResponse(mockResponse(412), {}).code).toBe('PRECONDITION_FAILED');
  });

  test('maps 422 → VALIDATION_FAIL', () => {
    expect(fromHttpResponse(mockResponse(422), {}).code).toBe('VALIDATION_FAIL');
  });

  test('maps 423 → LOCKED', () => {
    expect(fromHttpResponse(mockResponse(423), {}).code).toBe('LOCKED');
  });

  test('maps 424 → FAILED_DEPENDENCY', () => {
    expect(fromHttpResponse(mockResponse(424), {}).code).toBe('FAILED_DEPENDENCY');
  });

  test('maps 429 → RATE_LIMITED', () => {
    expect(fromHttpResponse(mockResponse(429), {}).code).toBe('RATE_LIMITED');
  });

  test('maps 500 → INTERNAL_SERVER_ERROR', () => {
    expect(fromHttpResponse(mockResponse(500), {}).code).toBe('INTERNAL_SERVER_ERROR');
  });

  test('maps 502 → SERVER_ERROR (generic 5xx)', () => {
    expect(fromHttpResponse(mockResponse(502), {}).code).toBe('SERVER_ERROR');
  });

  test('falls back to HTTP_ERROR for unmapped status', () => {
    expect(fromHttpResponse(mockResponse(418, "I'm a teapot"), {}).code).toBe('HTTP_ERROR');
  });

  test('extracts pegaErrorId from body.errors[0].ID', () => {
    const err = fromHttpResponse(mockResponse(404), {
      errors: [{ ID: 'ERR-0001', message: 'bad' }],
      localizedValue: 'Case not found',
    });
    expect(err.pegaErrorId).toBe('ERR-0001');
  });

  test('falls back message to statusText when body empty', () => {
    const err = fromHttpResponse(mockResponse(503, 'Service Unavailable'), {});
    expect(err.message).toBe('Service Unavailable');
  });
});

describe('fromNetworkError', () => {
  test('maps TypeError from fetch → NETWORK_ERROR', () => {
    const err = fromNetworkError(new TypeError('fetch failed'));
    expect(err).toEqual({
      code: 'NETWORK_ERROR',
      message: 'fetch failed',
      httpStatus: 0,
    });
  });

  test('maps AbortError → TIMEOUT', () => {
    const abort = new Error('aborted');
    abort.name = 'AbortError';
    const err = fromNetworkError(abort);
    expect(err.code).toBe('TIMEOUT');
  });
});

describe('isNormalizedError', () => {
  test('true for valid NormalizedError', () => {
    expect(isNormalizedError({ code: 'X', message: 'y', httpStatus: 1 })).toBe(true);
  });

  test('false for random objects', () => {
    expect(isNormalizedError({})).toBe(false);
    expect(isNormalizedError(null)).toBe(false);
    expect(isNormalizedError('error')).toBe(false);
  });
});
