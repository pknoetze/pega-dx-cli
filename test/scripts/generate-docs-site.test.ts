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

const { generateDocsSite } = await import('../../scripts/generate-docs-site.js');

afterEach(() => vol.reset());

// Shared manifest JSON for tests 1-3
const manifest = JSON.stringify({
  version: '1.0.0',
  commands: {
    'cases:get': {
      id: 'cases:get',
      description: 'Get a Pega case by ID',
      examples: ['<%= config.bin %> cases get MYAPP-CASE-1'],
      args: { caseId: { name: 'caseId', required: true, description: 'Full case handle' } },
      flags: {
        format: { name: 'format', type: 'option', description: 'Output format', default: 'json' },
      },
    },
    'cases:create': {
      id: 'cases:create',
      description: 'Create a new Pega case',
      examples: ['pega cases create --type InsuranceClaim'],
      args: {},
      flags: {
        type: { name: 'type', type: 'option', description: 'Case type ID', required: true },
      },
    },
    'auth:login': {
      id: 'auth:login',
      description: 'Log in to Pega',
      examples: ['pega auth login'],
      args: {},
      flags: {},
    },
  },
});

const caseGetTs =
  "export const __endpoint = { path: '/cases/{caseID}', method: 'GET' } as const;\nexport default class C {}\n";
const caseCreateTs =
  "export const __endpoint = { path: '/cases', method: 'POST' } as const;\nexport default class C {}\n";
const authLoginTs = 'export default class Login {}\n';

function setupVol() {
  vol.fromJSON({
    '/manifest.json': manifest,
    '/reference/api-coverage.md': '# Coverage\n\nbody\n',
    '/cmds/cases/get.ts': caseGetTs,
    '/cmds/cases/create.ts': caseCreateTs,
    '/cmds/auth/login.ts': authLoginTs,
  });
}

const opts = {
  manifestPath: '/manifest.json',
  coveragePath: '/reference/api-coverage.md',
  commandsRoot: '/cmds',
  siteDir: '/site',
};

describe('generateDocsSite', () => {
  it('writes one markdown page per topic', () => {
    setupVol();
    const result = generateDocsSite(opts);

    expect(result.topics).toContain('cases');
    expect(result.topics).toContain('auth');
    expect(result.pages).toBe(3); // index + cases + auth

    const casesMd = vol.readFileSync('/site/commands/cases.md', 'utf8') as string;
    expect(casesMd).toContain('## cases get');
    expect(casesMd).toContain('## cases create');
    expect(casesMd).toContain('Get a Pega case by ID');
    expect(casesMd).toContain('`GET /cases/{caseID}`');
    // config.bin substitution: raw template string must not appear in output
    expect(casesMd).not.toContain('<%= config.bin %>');
    expect(casesMd).toContain('pega cases get MYAPP-CASE-1');
    // H3 headings
    expect(casesMd).toContain('### Arguments');
    expect(casesMd).toContain('### Flags');
    expect(casesMd).toContain('### Examples');
    // Usage section
    expect(casesMd).toContain('### Usage');
    expect(casesMd).toContain('pega cases get <caseId> [flags]');
    // GitHub source link
    expect(casesMd).toContain('[view command source](https://github.com/pknoetze/pega-dx-cli/blob/main/');
  });

  it('writes sidebar-generated.ts with one entry per topic', () => {
    setupVol();
    generateDocsSite(opts);

    const sidebar = vol.readFileSync('/site/.vitepress/sidebar-generated.ts', 'utf8') as string;
    expect(sidebar).toContain("text: 'Commands'");
    expect(sidebar).toContain('/commands/cases');
    expect(sidebar).toContain('/commands/auth');
    // Must use default export so config.ts can read mod.default?.commands
    expect(sidebar).toContain('export default {');
    expect(sidebar).toContain('commands:');
  });

  it('copies coverage doc with prepended frontmatter', () => {
    setupVol();
    generateDocsSite(opts);

    const coverage = vol.readFileSync('/site/api-coverage.md', 'utf8') as string;
    expect(coverage).toMatch(/^---\ntitle: API Coverage/);
    expect(coverage).toContain('body');
  });

  it('fails when a command has no examples', () => {
    vol.fromJSON({
      '/manifest.json': JSON.stringify({
        version: '1.0.0',
        commands: {
          'cases:get': {
            id: 'cases:get',
            description: 'Get a Pega case by ID',
            examples: [],
            args: {},
            flags: {},
          },
        },
      }),
      '/reference/api-coverage.md': '# Coverage\n',
      '/cmds/cases/get.ts': caseGetTs,
    });

    expect(() => generateDocsSite(opts)).toThrow(/no examples/i);
  });
});
