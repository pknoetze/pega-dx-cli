import { describe, it, expect, afterEach, jest } from '@jest/globals';
import { vol } from 'memfs';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});
jest.unstable_mockModule('node:fs/promises', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs.promises, default: memfs.fs.promises };
});

const { extractSpecOperations, extractCommandEndpoints } = await import(
  '../../scripts/lib/endpoint-extractor.js'
);

afterEach(() => vol.reset());

describe('extractSpecOperations', () => {
  it('returns one entry per (path, verb) pair, verb uppercased', () => {
    vol.fromJSON({
      '/spec.yaml': [
        'paths:',
        '  /cases/{caseID}:',
        '    get: { operationId: getCase, summary: Get case }',
        '    delete: { operationId: deleteCase }',
        '  /cases:',
        '    post: { operationId: createCase }',
      ].join('\n'),
    });

    const ops = extractSpecOperations('/spec.yaml');
    expect(ops).toEqual(
      expect.arrayContaining([
        { path: '/cases/{caseID}', method: 'GET', operationId: 'getCase', summary: 'Get case' },
        { path: '/cases/{caseID}', method: 'DELETE', operationId: 'deleteCase', summary: undefined },
        { path: '/cases', method: 'POST', operationId: 'createCase', summary: undefined },
      ])
    );
    expect(ops).toHaveLength(3);
  });

  it('ignores non-verb keys (parameters, summary on the path)', () => {
    vol.fromJSON({
      '/spec.yaml': [
        'paths:',
        '  /x:',
        '    summary: parent',
        '    parameters: []',
        '    get: { operationId: x }',
      ].join('\n'),
    });
    expect(extractSpecOperations('/spec.yaml')).toEqual([
      { path: '/x', method: 'GET', operationId: 'x', summary: undefined },
    ]);
  });
});

describe('extractCommandEndpoints', () => {
  it('returns endpoint from a file that exports __endpoint', () => {
    vol.fromJSON({
      '/cmds/cases/get.ts':
        "export const __endpoint = { path: '/cases/{caseID}', method: 'GET' } as const;\nexport default class C {}\n",
    });
    const cmds = extractCommandEndpoints('/cmds');
    expect(cmds).toEqual([
      { file: '/cmds/cases/get.ts', path: '/cases/{caseID}', method: 'GET' },
    ]);
  });

  it('uppercases method', () => {
    vol.fromJSON({
      '/cmds/x.ts':
        "export const __endpoint = { path: '/x', method: 'post' } as const;\n",
    });
    expect(extractCommandEndpoints('/cmds')[0]).toMatchObject({ method: 'POST' });
  });

  it('returns null path/method when a command lacks __endpoint', () => {
    vol.fromJSON({ '/cmds/x.ts': 'export default class C {}\n' });
    expect(extractCommandEndpoints('/cmds')).toEqual([
      { file: '/cmds/x.ts', path: null, method: null },
    ]);
  });

  it('recurses into nested topic directories', () => {
    vol.fromJSON({
      '/cmds/cases/get.ts':
        "export const __endpoint = { path: '/cases/{caseID}', method: 'GET' } as const;\n",
      '/cmds/social/post-message.ts':
        "export const __endpoint = { path: '/messages', method: 'POST' } as const;\n",
    });
    expect(extractCommandEndpoints('/cmds')).toHaveLength(2);
  });

  it('skips non-.ts files', () => {
    vol.fromJSON({
      '/cmds/notes.md': '# notes',
      '/cmds/x.ts':
        "export const __endpoint = { path: '/x', method: 'GET' } as const;\n",
    });
    expect(extractCommandEndpoints('/cmds')).toHaveLength(1);
  });
});
