import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import nock from 'nock';
import { resetMockFs, seedFile } from '../../helpers/mock-filesystem.js';
import { captureOutput, type CapturedOutput } from '../../helpers/capture-output.js';
import { mockOAuthSuccess } from '../../helpers/mock-pega-api.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { default: CasesCreate } = await import('../../../src/commands/cases/create.js');

let captured: CapturedOutput;
let origEmitWarning: typeof process.emitWarning;

beforeEach(() => {
  resetMockFs();
  process.env.HOME = '/home/test';
  process.env.PEGA_BASE_URL = 'https://pega.example.com';
  process.env.PEGA_CLIENT_ID = 'id';
  process.env.PEGA_CLIENT_SECRET = 's';
  process.env.PEGA_NO_CACHE = 'true';
  if (!nock.isActive()) nock.activate();
  origEmitWarning = process.emitWarning;
  process.emitWarning = (warning: string | Error, ...args: unknown[]) => {
    const msg = typeof warning === 'string'
      ? warning
      : ((warning as { message?: string }).message ?? String(warning));
    origEmitWarning.call(process, msg, ...(args as []));
  };
});

afterEach(() => {
  nock.cleanAll();
  captured?.restore();
  process.emitWarning = origEmitWarning;
});

describe('cases create', () => {
  test('POSTs { caseTypeID } with no data', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .post('/prweb/api/application/v2/cases', { caseTypeID: 'Claim' })
      .reply(201, { id: 'NEW' });

    captured = captureOutput();
    await CasesCreate.run(['--type', 'Claim']);
    expect(JSON.parse(captured.stdout.join('')).id).toBe('NEW');
  });

  test('POSTs { caseTypeID, content } with inline --data', async () => {
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .post('/prweb/api/application/v2/cases', {
        caseTypeID: 'Claim',
        content: { policyNumber: '12345' },
      })
      .reply(201, { id: 'NEW' });

    captured = captureOutput();
    await CasesCreate.run(['--type', 'Claim', '--data', '{"policyNumber":"12345"}']);
    expect(JSON.parse(captured.stdout.join('')).id).toBe('NEW');
  });

  test('reads @file.json for --data', async () => {
    seedFile('/tmp/claim.json', '{"policyNumber":"99999"}');
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .post('/prweb/api/application/v2/cases', {
        caseTypeID: 'Claim',
        content: { policyNumber: '99999' },
      })
      .reply(201, { id: 'F' });

    captured = captureOutput();
    await CasesCreate.run(['--type', 'Claim', '--data', '@/tmp/claim.json']);
    expect(JSON.parse(captured.stdout.join('')).id).toBe('F');
  });

  test('invalid --data JSON exits with INVALID_ARGS', async () => {
    captured = captureOutput();
    await expect(CasesCreate.run(['--type', 'Claim', '--data', '{bad'])).rejects.toThrow();
    const err = JSON.parse(captured.stderr.join(''));
    expect(err.code).toBe('INVALID_ARGS');
  });

  test('--dry-run shows body without hitting network', async () => {
    captured = captureOutput();
    await CasesCreate.run(['--type', 'Claim', '--data', '{"k":"v"}', '--dry-run']);
    const out = JSON.parse(captured.stdout.join(''));
    expect(out.body).toEqual({ caseTypeID: 'Claim', content: { k: 'v' } });
  });
});
