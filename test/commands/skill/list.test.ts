import { describe, it, expect, afterEach, beforeEach, jest } from '@jest/globals';
import { vol } from 'memfs';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { listSkillTargets } = await import('../../../src/skill/list-impl.js');

beforeEach(() => {
  vol.fromJSON({
    '/src/skills/pega-dx/SKILL.md': '---\nname: pega-dx\nversion: 1.0.0\n---\n# body\n',
  });
});
afterEach(() => vol.reset());

describe('listSkillTargets', () => {
  it('returns skillVersion + one entry per target', () => {
    const res = listSkillTargets({ sourceDir: '/src/skills/pega-dx', home: '/h', cwd: '/c' });
    expect(res.skillVersion).toBe('1.0.0');
    expect(res.targets.map(t => t.target)).toContain('claude-code');
    expect(res.targets.find(t => t.target === 'cursor')?.destination)
      .toBe('/c/.cursor/rules/pega-dx.mdc');
  });
});
