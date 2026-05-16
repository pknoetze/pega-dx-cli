export interface SkillSource {
  skillMd: string;
  references: Record<string, string>;
}

export type ConvertTarget = 'cursor' | 'continue' | 'windsurf' | 'agents-md';

export interface ConvertOpts {
  source: SkillSource;
  target: ConvertTarget;
}

const REFERENCE_ORDER = [
  'concepts.md',
  'case-lifecycle.md',
  'data-views.md',
  'attachments-and-documents.md',
  'conversational-ai.md',
  'social-and-collab.md',
  'command-catalog.md',
];

function stripFrontmatter(md: string): string {
  if (!md.startsWith('---\n')) return md;
  const end = md.indexOf('\n---\n', 4);
  if (end === -1) return md;
  return md.slice(end + 5);
}

function slugify(heading: string): string {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function demoteHeadings(md: string): string {
  // Adds one # to each ATX heading (# → ##, ## → ###, up to ######)
  return md.replace(/^(#{1,5}) /gm, '#$1 ');
}

function firstH1(md: string): string {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? (m[1] ?? '').trim() : '';
}

function rewriteRefLinks(md: string, anchorByFile: Map<string, string>): string {
  return md.replace(
    /\[([^\]]+)\]\(references\/([a-z0-9-]+\.md)(#[a-zA-Z0-9-]+)?\)/g,
    (_match, text, file, frag) => {
      const anchor = anchorByFile.get(file) ?? slugify(file.replace(/\.md$/, ''));
      return `[${text}](#${anchor}${frag ?? ''})`;
    },
  );
}

export function convertSkillToSingleFile(opts: ConvertOpts): string {
  const { source, target } = opts;
  const stripped = stripFrontmatter(source.skillMd);
  const anchorByFile = new Map<string, string>();
  for (const file of REFERENCE_ORDER) {
    const ref = source.references[file];
    if (!ref) continue;
    const heading = firstH1(ref);
    anchorByFile.set(file, slugify(heading || file.replace(/\.md$/, '')));
  }
  const refsConcatenated = REFERENCE_ORDER
    .filter(file => source.references[file] !== undefined)
    .map(file => demoteHeadings(source.references[file] ?? ''))
    .join('\n');
  const body = [
    rewriteRefLinks(stripped, anchorByFile),
    '',
    rewriteRefLinks(refsConcatenated, anchorByFile),
  ].join('\n');

  if (target === 'cursor') {
    const fm = [
      '---',
      'description: Pega DX API v2 (Constellation) — use the pega CLI to work with cases, assignments, data views, attachments, and AI agents.',
      'globs: ["**/*"]',
      '---',
      '',
    ].join('\n');
    return fm + body;
  }
  if (target === 'agents-md') {
    return [
      '## Pega DX',
      '',
      '<!-- pega-dx-skill:start -->',
      body,
      '<!-- pega-dx-skill:end -->',
      '',
    ].join('\n');
  }
  return body;
}
