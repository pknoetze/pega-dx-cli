import * as fs from 'node:fs';
import * as path from 'node:path';

const VALID_SECTIONS = new Set([
  'concepts',
  'case-lifecycle',
  'data-views',
  'attachments-and-documents',
  'conversational-ai',
  'social-and-collab',
  'command-catalog',
]);

export interface ShowOpts {
  sourceDir: string;
  section?: string;
}

export interface ShowResult {
  section: string;
  content: string;
}

function stripFrontmatter(md: string): string {
  if (!md.startsWith('---\n')) return md;
  const end = md.indexOf('\n---\n', 4);
  return end === -1 ? md : md.slice(end + 5).trimStart();
}

export function readSkillSection(opts: ShowOpts): ShowResult {
  if (!opts.section) {
    const md = fs.readFileSync(path.join(opts.sourceDir, 'SKILL.md'), 'utf8');
    return { section: 'SKILL', content: stripFrontmatter(md) };
  }
  if (!VALID_SECTIONS.has(opts.section)) {
    const err: any = new Error(
      `INVALID_ARGS: unknown section "${opts.section}". Valid: SKILL, ${[...VALID_SECTIONS].join(', ')}`,
    );
    err.code = 'INVALID_ARGS';
    throw err;
  }
  const file = path.join(opts.sourceDir, 'references', `${opts.section}.md`);
  return { section: opts.section, content: fs.readFileSync(file, 'utf8') };
}

export function listValidSections(): string[] {
  return ['SKILL', ...[...VALID_SECTIONS]];
}
