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

const { generateSkillCatalog } = await import('../../scripts/generate-skill-catalog.js');

afterEach(() => vol.reset());

const manifestFixture = JSON.stringify({
  version: '1.0.0',
  commands: {
    'tags list': {
      id: 'tags list',
      description: 'List all tags on a case',
      examples: ['<%= config.bin %> tags list MYAPP-CASE-1'],
      args: { caseId: { name: 'caseId', required: true, description: 'Case ID' } },
      flags: {},
    },
    'tags add': {
      id: 'tags add',
      description: 'Add tags to a case',
      examples: [],
      args: { caseId: { name: 'caseId', required: true } },
      flags: { tag: { name: 'tag', required: true, multiple: true } },
    },
    'cases get': {
      id: 'cases get',
      description: 'Fetch a case by ID',
      examples: ['<%= config.bin %> cases get MYAPP-CASE-1'],
      args: { caseId: { name: 'caseId', required: true } },
      flags: {},
    },
    'attachments list': {
      id: 'attachments list',
      description: 'List attachments on a case',
      examples: ['<%= config.bin %> attachments list MYAPP-CASE-1'],
      args: { caseId: { name: 'caseId', required: true } },
      flags: {},
    },
  },
});

const pkgFixture = JSON.stringify({
  name: 'pega-dx-cli',
  version: '1.2.3',
  oclif: { bin: 'pega', topics: { cases: {}, tags: {} } },
});

const skillFixture = '---\nname: pega-dx\nversion: 0.0.0\n---\n# body\n';

describe('generateSkillCatalog', () => {
  it('emits topic-grouped catalog with H3 per command', () => {
    vol.fromJSON({
      '/oclif.manifest.json': manifestFixture,
      '/package.json': pkgFixture,
      '/skills/pega-dx/SKILL.md': skillFixture,
    });

    const res = generateSkillCatalog({ repoRoot: '/', mode: 'write' });

    expect(res.changed).toBe(true);
    const catalog = vol.toJSON()['/skills/pega-dx/references/command-catalog.md'] as string;
    expect(catalog).toContain('## cases');
    expect(catalog).toContain('## tags');
    expect(catalog.indexOf('## cases')).toBeLessThan(catalog.indexOf('## tags')); // topic order from pkg.oclif.topics
    expect(catalog).toContain('### `pega cases get`');
    expect(catalog).toContain('### `pega tags list`');
    expect(catalog).toContain('Fetch a case by ID');
    // Topics not declared in oclif.topics must still appear (after declared topics).
    expect(catalog).toContain('## attachments');
    expect(catalog).toContain('### `pega attachments list`');
    expect(catalog.indexOf('## tags')).toBeLessThan(catalog.indexOf('## attachments'));
  });

  it('rewrites SKILL.md version from package.json', () => {
    vol.fromJSON({
      '/oclif.manifest.json': manifestFixture,
      '/package.json': pkgFixture,
      '/skills/pega-dx/SKILL.md': skillFixture,
    });

    generateSkillCatalog({ repoRoot: '/', mode: 'write' });

    const skill = vol.toJSON()['/skills/pega-dx/SKILL.md'] as string;
    expect(skill).toMatch(/^version: 1\.2\.3$/m);
    expect(skill).not.toMatch(/^version: 0\.0\.0$/m);
  });

  it('is idempotent', () => {
    vol.fromJSON({
      '/oclif.manifest.json': manifestFixture,
      '/package.json': pkgFixture,
      '/skills/pega-dx/SKILL.md': skillFixture,
    });

    const first = generateSkillCatalog({ repoRoot: '/', mode: 'write' });
    const snap1 = JSON.stringify(vol.toJSON());
    const second = generateSkillCatalog({ repoRoot: '/', mode: 'write' });
    const snap2 = JSON.stringify(vol.toJSON());

    expect(first.changed).toBe(true);
    expect(second.changed).toBe(false);
    expect(snap1).toBe(snap2);
  });

  it('check mode returns changed=true and writes nothing when out of date', () => {
    vol.fromJSON({
      '/oclif.manifest.json': manifestFixture,
      '/package.json': pkgFixture,
      '/skills/pega-dx/SKILL.md': skillFixture,
      '/skills/pega-dx/references/command-catalog.md': '# stale\n',
    });

    const snapshot = JSON.stringify(vol.toJSON());
    const res = generateSkillCatalog({ repoRoot: '/', mode: 'check' });

    expect(res.changed).toBe(true);
    expect(JSON.stringify(vol.toJSON())).toBe(snapshot); // nothing written
  });
});
