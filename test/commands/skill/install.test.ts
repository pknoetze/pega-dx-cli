import { describe, it, expect, afterEach, beforeEach, jest } from '@jest/globals';
import { vol } from 'memfs';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});
jest.unstable_mockModule('node:fs/promises', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs.promises, default: memfs.fs.promises };
});

const { installSkill } = await import('../../../src/skill/install-impl.js');

const skillFiles = {
  '/src/skills/pega-dx/SKILL.md': '---\nname: pega-dx\nversion: 1.0.0\n---\n# body\n',
  '/src/skills/pega-dx/references/concepts.md': '# Concepts\n',
  '/src/skills/pega-dx/references/case-lifecycle.md': '# Case Lifecycle\n',
  '/src/skills/pega-dx/references/data-views.md': '# Data Views\n',
  '/src/skills/pega-dx/references/attachments-and-documents.md': '# Attachments\n',
  '/src/skills/pega-dx/references/conversational-ai.md': '# Conv AI\n',
  '/src/skills/pega-dx/references/social-and-collab.md': '# Social\n',
  '/src/skills/pega-dx/references/command-catalog.md': '# Catalog\n',
  '/src/skills/pega-dx/assets/.gitkeep': '',
  '/cwd/.keep': '',
};

beforeEach(() => vol.fromJSON(skillFiles));
afterEach(() => vol.reset());

describe('installSkill', () => {
  it('claude-code copies full directory to ~/.claude/skills/pega-dx', () => {
    const res = installSkill({
      target: 'claude-code',
      sourceDir: '/src/skills/pega-dx',
      home: '/home/x',
      cwd: '/cwd',
      force: false,
      dryRun: false,
    });
    expect(res.destination).toBe('/home/x/.claude/skills/pega-dx');
    expect(res.format).toBe('dir');
    expect(res.files).toBe(9);
    const j = vol.toJSON();
    expect(j['/home/x/.claude/skills/pega-dx/SKILL.md']).toBeDefined();
    expect(j['/home/x/.claude/skills/pega-dx/references/concepts.md']).toBeDefined();
  });

  it('cursor writes a single .mdc file with frontmatter', () => {
    const res = installSkill({
      target: 'cursor',
      sourceDir: '/src/skills/pega-dx',
      home: '/home/x',
      cwd: '/cwd',
      force: false,
      dryRun: false,
    });
    expect(res.destination).toBe('/cwd/.cursor/rules/pega-dx.mdc');
    expect(res.format).toBe('file');
    expect(res.files).toBe(1);
    const content = vol.toJSON()['/cwd/.cursor/rules/pega-dx.mdc'] as string;
    expect(content.startsWith('---\n')).toBe(true);
    expect(content).toContain('description: Pega DX API v2');
  });

  it('refuses overwrite without --force', () => {
    vol.mkdirSync('/home/x/.claude/skills/pega-dx', { recursive: true });
    vol.writeFileSync('/home/x/.claude/skills/pega-dx/SKILL.md', 'stale');
    expect(() => installSkill({
      target: 'claude-code', sourceDir: '/src/skills/pega-dx',
      home: '/home/x', cwd: '/cwd', force: false, dryRun: false,
    })).toThrow(/INVALID_ARGS|already exists/);
  });

  it('--force overwrites existing directory', () => {
    vol.mkdirSync('/home/x/.claude/skills/pega-dx', { recursive: true });
    vol.writeFileSync('/home/x/.claude/skills/pega-dx/SKILL.md', 'stale');
    const res = installSkill({
      target: 'claude-code', sourceDir: '/src/skills/pega-dx',
      home: '/home/x', cwd: '/cwd', force: true, dryRun: false,
    });
    expect(res.files).toBeGreaterThan(1);
    const content = vol.toJSON()['/home/x/.claude/skills/pega-dx/SKILL.md'] as string;
    expect(content).not.toBe('stale');
  });

  it('--dry-run writes nothing and returns dryRun: true', () => {
    const snapshot = JSON.stringify(vol.toJSON());
    const res = installSkill({
      target: 'cursor', sourceDir: '/src/skills/pega-dx',
      home: '/home/x', cwd: '/cwd', force: false, dryRun: true,
    });
    expect(res.dryRun).toBe(true);
    expect(JSON.stringify(vol.toJSON())).toBe(snapshot);
  });

  it('agents-md appends to existing file under markers', () => {
    vol.writeFileSync('/cwd/AGENTS.md', '# Project rules\n\nOther stuff.\n');
    installSkill({
      target: 'agents-md', sourceDir: '/src/skills/pega-dx',
      home: '/home/x', cwd: '/cwd', force: false, dryRun: false,
    });
    const content = vol.readFileSync('/cwd/AGENTS.md', 'utf8') as string;
    expect(content).toContain('# Project rules');
    expect(content).toContain('<!-- pega-dx-skill:start -->');
    expect(content).toContain('<!-- pega-dx-skill:end -->');
  });

  it('agents-md replaces existing markers under --force', () => {
    vol.writeFileSync(
      '/cwd/AGENTS.md',
      '# Project rules\n\n## Pega DX\n<!-- pega-dx-skill:start -->\nOLD\n<!-- pega-dx-skill:end -->\n',
    );
    installSkill({
      target: 'agents-md', sourceDir: '/src/skills/pega-dx',
      home: '/home/x', cwd: '/cwd', force: true, dryRun: false,
    });
    const content = vol.readFileSync('/cwd/AGENTS.md', 'utf8') as string;
    expect(content).not.toContain('OLD');
    expect((content.match(/<!-- pega-dx-skill:start -->/g) ?? []).length).toBe(1);
  });

  it('dir target requires --dest', () => {
    expect(() => installSkill({
      target: 'dir', sourceDir: '/src/skills/pega-dx',
      home: '/home/x', cwd: '/cwd', force: false, dryRun: false,
    })).toThrow(/INVALID_ARGS|dest is required/);
  });
});
