import { describe, it, expect, afterEach, beforeEach, jest } from '@jest/globals';
import { vol } from 'memfs';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { readSkillSection } = await import('../../../src/skill/show-impl.js');

beforeEach(() => {
  vol.fromJSON({
    '/src/skills/pega-dx/SKILL.md': '---\nname: pega-dx\nversion: 1.0.0\n---\n# Pega-dx body\n',
    '/src/skills/pega-dx/references/concepts.md': '# Concepts\n\nDetails.\n',
    '/src/skills/pega-dx/references/case-lifecycle.md': '# Case Lifecycle\n',
  });
});
afterEach(() => vol.reset());

describe('readSkillSection', () => {
  it('returns SKILL.md body (frontmatter stripped) with no section arg', () => {
    const res = readSkillSection({ sourceDir: '/src/skills/pega-dx' });
    expect(res.section).toBe('SKILL');
    expect(res.content).toContain('# Pega-dx body');
    expect(res.content).not.toContain('---');
  });

  it('returns named reference content', () => {
    const res = readSkillSection({ sourceDir: '/src/skills/pega-dx', section: 'concepts' });
    expect(res.section).toBe('concepts');
    expect(res.content).toContain('# Concepts');
  });

  it('throws INVALID_ARGS for unknown section', () => {
    expect(() => readSkillSection({ sourceDir: '/src/skills/pega-dx', section: 'bogus' }))
      .toThrow(/INVALID_ARGS/);
  });
});
