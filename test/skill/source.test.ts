import { describe, it, expect, afterEach, jest } from '@jest/globals';
import { vol } from 'memfs';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { resolveSkillSource } = await import('../../src/skill/source.js');

afterEach(() => vol.reset());

describe('resolveSkillSource', () => {
  it('prefers the npm install location when both exist', () => {
    vol.fromJSON({
      '/install/skills/pega-dx/SKILL.md': '---\nname: pega-dx\n---\n',
      '/repo/skills/pega-dx/SKILL.md': '---\nname: pega-dx\n---\n',
    });
    const dir = resolveSkillSource({ installRoot: '/install', repoRoot: '/repo' });
    expect(dir).toBe('/install/skills/pega-dx');
  });

  it('falls back to repo root when install path is missing', () => {
    vol.fromJSON({ '/repo/skills/pega-dx/SKILL.md': '---\n' });
    const dir = resolveSkillSource({ installRoot: '/install', repoRoot: '/repo' });
    expect(dir).toBe('/repo/skills/pega-dx');
  });

  it('throws INVALID_CONFIG when neither exists', () => {
    vol.fromJSON({});
    expect(() => resolveSkillSource({ installRoot: '/install', repoRoot: '/repo' }))
      .toThrow(/INVALID_CONFIG/);
  });
});
