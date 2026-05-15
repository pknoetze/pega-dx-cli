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

const { runAudit } = await import('../../scripts/audit-endpoints.js');

afterEach(() => vol.reset());

const minimalSpec = [
  'info:',
  '  version: 25.1.2',
  'paths:',
  '  /cases/{caseID}:',
  '    get: { operationId: getCase, summary: Get case }',
  '  /cases:',
  '    post: { operationId: createCase }',
].join('\n');

const caseGetTs =
  "export const __endpoint = { path: '/cases/{caseID}', method: 'GET' } as const;\nexport default class C {}\n";
const casePostTs =
  "export const __endpoint = { path: '/cases', method: 'POST' } as const;\nexport default class C {}\n";

describe('runAudit', () => {
  it('classifies matching commands as OK', () => {
    vol.fromJSON({
      '/spec.yaml': minimalSpec,
      '/cmds/cases/get.ts': caseGetTs,
      '/cmds/cases/create.ts': casePostTs,
    });

    const res = runAudit({
      specPath: '/spec.yaml',
      commandsRoot: '/cmds',
      outputPath: '/out.md',
    });

    expect(res.missing).toEqual([]);
    expect(res.drift).toEqual([]);
    expect(res.ok).toBe(2);
    expect(res.exitCode).toBe(0);
  });

  it('flags missing endpoints', () => {
    vol.fromJSON({
      '/spec.yaml': minimalSpec,
      '/cmds/cases/get.ts': caseGetTs,
      // createCase is absent
    });

    const res = runAudit({
      specPath: '/spec.yaml',
      commandsRoot: '/cmds',
      outputPath: '/out.md',
    });

    expect(res.missing).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: '/cases', method: 'POST' })])
    );
    expect(res.exitCode).toBe(1);
  });

  it('flags drift when command declares endpoint not in spec', () => {
    vol.fromJSON({
      '/spec.yaml': minimalSpec,
      '/cmds/cases/get.ts': caseGetTs,
      '/cmds/cases/create.ts': casePostTs,
      '/cmds/legacy/get.ts':
        "export const __endpoint = { path: '/legacy/{id}', method: 'GET' } as const;\nexport default class C {}\n",
    });

    const res = runAudit({
      specPath: '/spec.yaml',
      commandsRoot: '/cmds',
      outputPath: '/out.md',
    });

    expect(res.drift).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/legacy/{id}', method: 'GET' }),
      ])
    );
    expect(res.exitCode).toBe(1);
  });

  it('lists CLI-only commands informationally, does not fail exit code', () => {
    vol.fromJSON({
      '/spec.yaml': minimalSpec,
      '/cmds/cases/get.ts': caseGetTs,
      '/cmds/cases/create.ts': casePostTs,
      '/cmds/auth/login.ts': 'export default class Login {}\n',
    });

    const res = runAudit({
      specPath: '/spec.yaml',
      commandsRoot: '/cmds',
      outputPath: '/out.md',
    });

    expect(res.cliOnly).toEqual(
      expect.arrayContaining([expect.objectContaining({ file: '/cmds/auth/login.ts' })])
    );
    expect(res.exitCode).toBe(0);
  });

  it('writes coverage doc with spec version, summary, and endpoint map', () => {
    vol.fromJSON({
      '/spec.yaml': minimalSpec,
      '/cmds/cases/get.ts': caseGetTs,
      '/cmds/cases/create.ts': casePostTs,
    });

    runAudit({
      specPath: '/spec.yaml',
      commandsRoot: '/cmds',
      outputPath: '/out.md',
    });

    const md = vol.readFileSync('/out.md', 'utf8') as string;

    expect(md).toContain('Pega DX API v25.1.2 — Coverage Matrix');
    expect(md).toContain('Implemented: 2 / 2');
    expect(md).toContain('| GET | `/cases/{caseID}` |');
    expect(md).toContain('| POST | `/cases` |');
  });
});
