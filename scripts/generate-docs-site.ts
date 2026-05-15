import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractCommandEndpoints, type CommandEndpoint } from './lib/endpoint-extractor.js';

interface OclifArg {
  name: string;
  required?: boolean;
  description?: string;
}

interface OclifFlag {
  name: string;
  required?: boolean;
  type?: string;
  description?: string;
  default?: unknown;
  char?: string;
  options?: string[];
}

interface OclifCommand {
  id: string;
  description?: string;
  examples?: string[];
  args?: Record<string, OclifArg>;
  flags?: Record<string, OclifFlag>;
}

interface OclifManifest {
  version: string;
  commands: Record<string, OclifCommand>;
}

function endpointMap(endpoints: CommandEndpoint[]): Map<string, CommandEndpoint> {
  const map = new Map<string, CommandEndpoint>();
  for (const ep of endpoints) {
    // Key by file path; also build a command-id-friendly key from the file path
    const m = ep.file.match(/[/\\]([^/\\]+)[/\\]([^/\\]+)\.ts$/);
    if (m) {
      const key = `${m[1]}:${m[2]}`;
      map.set(key, ep);
    }
  }
  return map;
}

function renderArgsTable(args: Record<string, OclifArg>): string {
  const entries = Object.values(args);
  if (entries.length === 0) return '';
  const lines: string[] = [
    '**Arguments**',
    '',
    '| Argument | Required | Description |',
    '|---|---|---|',
  ];
  for (const arg of entries) {
    lines.push(`| \`${arg.name}\` | ${arg.required ? 'Yes' : 'No'} | ${arg.description ?? ''} |`);
  }
  return lines.join('\n') + '\n';
}

function renderFlagsTable(flags: Record<string, OclifFlag>): string {
  const entries = Object.values(flags);
  if (entries.length === 0) return '';
  const lines: string[] = [
    '**Flags**',
    '',
    '| Flag | Type | Required | Default | Description |',
    '|---|---|---|---|---|',
  ];
  for (const flag of entries) {
    const charStr = flag.char ? `-${flag.char}, ` : '';
    const nameStr = `${charStr}--${flag.name}`;
    const typeStr = flag.type ?? 'boolean';
    const required = flag.required ? 'Yes' : 'No';
    const def = flag.default !== undefined ? `\`${flag.default}\`` : '';
    lines.push(`| \`${nameStr}\` | ${typeStr} | ${required} | ${def} | ${flag.description ?? ''} |`);
  }
  return lines.join('\n') + '\n';
}

function renderExamples(examples: string[]): string {
  const lines: string[] = ['**Examples**', ''];
  for (const ex of examples) {
    lines.push('```sh');
    lines.push(ex);
    lines.push('```');
  }
  return lines.join('\n') + '\n';
}

function renderCommandSection(cmd: OclifCommand, ep: CommandEndpoint | undefined): string {
  const lines: string[] = [];
  const label = cmd.id.replace(':', ' ');
  lines.push(`## ${label}`);
  lines.push('');
  if (cmd.description) {
    lines.push(cmd.description);
    lines.push('');
  }
  if (ep && ep.path && ep.method) {
    lines.push(`**Endpoint:** ${ep.method} \`${ep.path}\``);
    lines.push('');
  }
  if (cmd.args && Object.keys(cmd.args).length > 0) {
    lines.push(renderArgsTable(cmd.args));
    lines.push('');
  }
  if (cmd.flags && Object.keys(cmd.flags).length > 0) {
    lines.push(renderFlagsTable(cmd.flags));
    lines.push('');
  }
  if (cmd.examples && cmd.examples.length > 0) {
    lines.push(renderExamples(cmd.examples));
    lines.push('');
  }
  return lines.join('\n');
}

function renderTopicPage(
  topic: string,
  commands: OclifCommand[],
  endpoints: Map<string, CommandEndpoint>
): string {
  const lines: string[] = [
    '---',
    `title: ${topic}`,
    `description: ${topic} commands`,
    '---',
    '',
    `# ${topic}`,
    '',
  ];
  for (const cmd of commands) {
    const ep = endpoints.get(cmd.id);
    lines.push(renderCommandSection(cmd, ep));
  }
  return lines.join('\n');
}

function renderCommandsIndex(
  topics: string[],
  byTopic: Map<string, OclifCommand[]>
): string {
  const lines: string[] = [
    '---',
    'title: Commands',
    'description: All CLI commands grouped by topic.',
    '---',
    '',
    '# Commands',
    '',
    'Commands are grouped by topic.',
    '',
  ];
  for (const topic of topics) {
    const cmds = byTopic.get(topic) ?? [];
    lines.push(`## [${topic}](./${topic}.md)`);
    lines.push('');
    for (const cmd of cmds) {
      const label = cmd.id.replace(':', ' ');
      lines.push(`- **${label}** — ${cmd.description ?? ''}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function renderSidebar(topics: string[]): string {
  const items = topics
    .map(
      (t) =>
        `    { text: '${t}', link: '/commands/${t}' },`
    )
    .join('\n');
  return [
    "// Auto-generated — do not edit by hand. Run: npm run docs:generate",
    "export const commands = [",
    "  {",
    "    text: 'Commands',",
    "    collapsed: false,",
    "    items: [",
    items,
    "    ],",
    "  },",
    "];",
    "",
  ].join('\n');
}

export function generateDocsSite(opts: {
  manifestPath: string;
  coveragePath: string;
  commandsRoot: string;
  siteDir: string;
}): { topics: string[]; pages: number } {
  const manifest: OclifManifest = JSON.parse(fs.readFileSync(opts.manifestPath, 'utf8'));
  const rawEndpoints = extractCommandEndpoints(opts.commandsRoot);
  const endpoints = endpointMap(rawEndpoints);

  // Group commands by topic (first segment of id)
  const byTopic = new Map<string, OclifCommand[]>();
  for (const cmd of Object.values(manifest.commands)) {
    if (!cmd.examples || cmd.examples.length === 0) {
      throw new Error(`Command ${cmd.id} has no examples — cannot generate docs.`);
    }
    const topic = cmd.id.split(':')[0] ?? cmd.id;
    if (!byTopic.has(topic)) byTopic.set(topic, []);
    byTopic.get(topic)!.push(cmd);
  }

  // Sort commands within topic, and topics alphabetically
  const topics = [...byTopic.keys()].sort();
  for (const t of topics) byTopic.get(t)!.sort((a, b) => a.id.localeCompare(b.id));

  // Ensure target dirs
  fs.mkdirSync(path.join(opts.siteDir, 'commands'), { recursive: true });
  fs.mkdirSync(path.join(opts.siteDir, '.vitepress'), { recursive: true });

  // commands/index.md
  fs.writeFileSync(
    path.join(opts.siteDir, 'commands', 'index.md'),
    renderCommandsIndex(topics, byTopic)
  );

  // commands/<topic>.md
  let pages = 1; // index counts as one
  for (const topic of topics) {
    const md = renderTopicPage(topic, byTopic.get(topic)!, endpoints);
    fs.writeFileSync(path.join(opts.siteDir, 'commands', `${topic}.md`), md);
    pages++;
  }

  // api-coverage.md (with frontmatter)
  const coverage = fs.readFileSync(opts.coveragePath, 'utf8');
  const withFrontmatter =
    '---\ntitle: API Coverage\ndescription: Complete mapping of every Pega DX API operation to a CLI command.\n---\n\n' +
    coverage;
  fs.writeFileSync(path.join(opts.siteDir, 'api-coverage.md'), withFrontmatter);

  // sidebar-generated.ts
  const sidebar = renderSidebar(topics);
  fs.writeFileSync(path.join(opts.siteDir, '.vitepress', 'sidebar-generated.ts'), sidebar);

  return { topics, pages };
}

// ESM-compatible CLI entry detection
const isMain =
  process.argv[1] !== undefined &&
  (() => {
    try {
      return fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
    } catch {
      return false;
    }
  })();

if (isMain) {
  const siteDir = path.resolve(process.cwd(), 'site');
  const result = generateDocsSite({
    manifestPath: path.resolve(process.cwd(), 'oclif.manifest.json'),
    coveragePath: path.resolve(process.cwd(), 'reference/api-coverage.md'),
    commandsRoot: path.resolve(process.cwd(), 'src/commands'),
    siteDir,
  });
  console.log(`Generated ${result.pages} pages for ${result.topics.length} topics:`);
  for (const t of result.topics) console.log(`  - ${t}`);
}
