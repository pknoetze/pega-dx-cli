import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { describe, it, expect, afterEach } from '@jest/globals';
import { installSkill } from '../../src/skill/install-impl.js';

const SOURCE = path.resolve(process.cwd(), 'skills/pega-dx');

function tmpRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'skill-smoke-'));
}

describe('skill install (smoke)', () => {
  let root: string;
  afterEach(() => {
    if (root) fs.rmSync(root, { recursive: true, force: true });
  });

  it('claude-code writes a real directory under fake home', () => {
    root = tmpRoot();
    const res = installSkill({
      target: 'claude-code', sourceDir: SOURCE,
      home: root, cwd: root, force: false, dryRun: false,
    });
    expect(res.format).toBe('dir');
    expect(fs.existsSync(path.join(res.destination, 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(res.destination, 'references/concepts.md'))).toBe(true);
  });

  it('cursor writes a single .mdc file with .mdc frontmatter', () => {
    root = tmpRoot();
    const res = installSkill({
      target: 'cursor', sourceDir: SOURCE,
      home: root, cwd: root, force: false, dryRun: false,
    });
    expect(res.format).toBe('file');
    const content = fs.readFileSync(res.destination, 'utf8');
    expect(content.startsWith('---\n')).toBe(true);
    expect(content).toContain('description: Pega DX API v2');
  });

  it('agents-md creates then --force replaces under markers', () => {
    root = tmpRoot();
    installSkill({
      target: 'agents-md', sourceDir: SOURCE,
      home: root, cwd: root, force: false, dryRun: false,
    });
    installSkill({
      target: 'agents-md', sourceDir: SOURCE,
      home: root, cwd: root, force: true, dryRun: false,
    });
    const content = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
    expect((content.match(/<!-- pega-dx-skill:start -->/g) ?? []).length).toBe(1);
  });
});
