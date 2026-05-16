import { describe, it, expect } from '@jest/globals';
import { convertSkillToSingleFile } from '../../src/skill/convert.js';

const fixtureSource = {
  skillMd: [
    '---',
    'name: pega-dx',
    'description: |',
    '  Use whenever ...',
    'version: 1.0.0',
    '---',
    '',
    '# pega-dx — Skill body',
    '',
    'Body content. See [concepts](references/concepts.md) for eTag rules.',
  ].join('\n'),
  references: {
    'concepts.md': '# Concepts\n\nDetails.\n',
    'case-lifecycle.md': '# Case Lifecycle\n\nDetails.\n',
    'data-views.md': '# Data Views\n\nDetails.\n',
    'attachments-and-documents.md': '# Attachments\n\nDetails.\n',
    'conversational-ai.md': '# Conversational AI\n\nDetails.\n',
    'social-and-collab.md': '# Social & Collab\n\nDetails.\n',
    'command-catalog.md': '# Command Catalog\n\nDetails.\n',
  },
};

describe('convertSkillToSingleFile', () => {
  it('strips frontmatter and concatenates references in order', () => {
    const out = convertSkillToSingleFile({ source: fixtureSource, target: 'continue' });
    expect(out).not.toMatch(/^---$/m);
    expect(out).not.toContain('version: 1.0.0');
    expect(out.indexOf('## Concepts')).toBeGreaterThan(-1);
    expect(out.indexOf('## Concepts')).toBeLessThan(out.indexOf('## Case Lifecycle'));
    expect(out.indexOf('## Case Lifecycle')).toBeLessThan(out.indexOf('## Data Views'));
    expect(out.indexOf('## Command Catalog')).toBeGreaterThan(out.indexOf('## Social & Collab'));
  });

  it('demotes H1 to H2 in references', () => {
    const out = convertSkillToSingleFile({ source: fixtureSource, target: 'continue' });
    expect(out).toContain('## Concepts');
    expect(out).not.toMatch(/^# Concepts$/m);
  });

  it('rewrites references/X.md links to internal anchors', () => {
    const out = convertSkillToSingleFile({ source: fixtureSource, target: 'continue' });
    expect(out).not.toContain('references/concepts.md');
    expect(out).toMatch(/\[concepts\]\(#concepts\)/);
  });

  it('cursor target prepends .mdc frontmatter', () => {
    const out = convertSkillToSingleFile({ source: fixtureSource, target: 'cursor' });
    expect(out.startsWith('---\n')).toBe(true);
    expect(out).toContain('description: Pega DX API v2');
    expect(out).toContain('globs:');
  });

  it('agents-md target wraps in HTML-comment markers under ## Pega DX', () => {
    const out = convertSkillToSingleFile({ source: fixtureSource, target: 'agents-md' });
    expect(out).toContain('<!-- pega-dx-skill:start -->');
    expect(out).toContain('<!-- pega-dx-skill:end -->');
    expect(out.indexOf('<!-- pega-dx-skill:start -->'))
      .toBeLessThan(out.indexOf('<!-- pega-dx-skill:end -->'));
    expect(out).toMatch(/^## Pega DX$/m);
  });

  it('is idempotent', () => {
    const a = convertSkillToSingleFile({ source: fixtureSource, target: 'continue' });
    const b = convertSkillToSingleFile({ source: fixtureSource, target: 'continue' });
    expect(a).toBe(b);
  });
});
