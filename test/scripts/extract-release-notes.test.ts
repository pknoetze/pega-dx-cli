import { describe, it, expect } from '@jest/globals';

const { extractReleaseNotes } = await import('../../scripts/extract-release-notes.js');

const sample = [
  '# Changelog',
  '',
  '## [1.0.0] - 2026-05-15',
  '',
  '### Added',
  '- Thing one',
  '- Thing two',
  '',
  '## [0.9.0] - 2026-05-14',
  '',
  '### Added',
  '- Earlier thing',
].join('\n');

describe('extractReleaseNotes', () => {
  it('extracts the section body without the headers', () => {
    expect(extractReleaseNotes(sample, '1.0.0')).toBe(
      ['', '### Added', '- Thing one', '- Thing two', ''].join('\n')
    );
  });

  it('returns null when section absent', () => {
    expect(extractReleaseNotes(sample, '2.0.0')).toBeNull();
  });

  it('accepts version with or without leading v', () => {
    expect(extractReleaseNotes(sample, 'v1.0.0')).not.toBeNull();
  });

  it('handles last section (no next header)', () => {
    const onlyOne = '# Changelog\n\n## [0.9.0] - 2026-05-14\n\n### Added\n- Thing\n';
    expect(extractReleaseNotes(onlyOne, '0.9.0')).toBe('\n### Added\n- Thing\n');
  });
});
