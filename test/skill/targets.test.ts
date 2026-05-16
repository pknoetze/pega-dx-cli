import { describe, it, expect } from '@jest/globals';
import { resolveTargetDest, listTargets, SKILL_TARGETS } from '../../src/skill/targets.js';

describe('resolveTargetDest', () => {
  const opts = { home: '/Users/x', cwd: '/Users/x/projects/foo' };

  it.each([
    ['claude-code',    '/Users/x/.claude/skills/pega-dx',                  'dir'],
    ['claude-project', '/Users/x/projects/foo/.claude/skills/pega-dx',    'dir'],
    ['cursor',         '/Users/x/projects/foo/.cursor/rules/pega-dx.mdc', 'file'],
    ['continue',       '/Users/x/projects/foo/.continue/rules/pega-dx.md','file'],
    ['windsurf',       '/Users/x/projects/foo/.windsurf/rules/pega-dx.md','file'],
    ['agents-md',      '/Users/x/projects/foo/AGENTS.md',                 'file'],
  ])('resolves %s to %s (%s)', (target, expected, format) => {
    const res = resolveTargetDest(target as any, opts);
    expect(res.destination).toBe(expected);
    expect(res.format).toBe(format);
  });

  it('resolves dir target with explicit dest', () => {
    const res = resolveTargetDest('dir', { ...opts, dest: '/tmp/out' });
    expect(res.destination).toBe('/tmp/out');
    expect(res.format).toBe('dir');
  });

  it('throws INVALID_ARGS when dir target has no dest', () => {
    expect(() => resolveTargetDest('dir', opts)).toThrow(/INVALID_ARGS/);
  });

  it('throws INVALID_ARGS on unknown target', () => {
    expect(() => resolveTargetDest('bogus' as any, opts)).toThrow(/INVALID_ARGS/);
  });
});

describe('listTargets', () => {
  it('returns one entry per supported target', () => {
    const entries = listTargets({ home: '/Users/x', cwd: '/Users/x/p' });
    const names = entries.map(e => e.target);
    expect(names).toEqual(SKILL_TARGETS);
    expect(entries.find(e => e.target === 'cursor')?.destination)
      .toBe('/Users/x/p/.cursor/rules/pega-dx.mdc');
  });
});
