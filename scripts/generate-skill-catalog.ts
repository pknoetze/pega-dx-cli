import * as fs from 'node:fs';
import * as path from 'node:path';

export interface GenerateResult {
  changed: boolean;
  files: string[];
}

export interface GenerateOpts {
  repoRoot: string;
  mode: 'write' | 'check';
}

interface OclifFlag {
  name: string;
  required?: boolean;
  type?: string;
  multiple?: boolean;
  description?: string;
}

interface OclifArg {
  name: string;
  required?: boolean;
  description?: string;
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

interface PackageJson {
  version: string;
  oclif: { bin: string; topics: Record<string, unknown> };
}

function readJson<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
}

function topicOf(commandId: string): string {
  return commandId.split(/[ :]/)[0] ?? commandId;
}

function renderExample(cmd: OclifCommand, bin: string): string {
  if (cmd.examples && cmd.examples.length > 0) {
    return (cmd.examples[0] ?? '').replace(/<%= config\.bin %>/g, bin);
  }
  return `${bin} ${cmd.id} --help`;
}

function renderFlags(cmd: OclifCommand): string {
  const flags = Object.values(cmd.flags ?? {});
  if (flags.length === 0) return '_No command-specific flags._';
  const lines = ['| Flag | Type | Required | Description |', '|---|---|---|---|'];
  for (const f of flags) {
    const type = f.type ?? (f.multiple ? 'string[]' : 'string');
    lines.push(`| \`--${f.name}\` | ${type} | ${f.required ? 'Yes' : 'No'} | ${f.description ?? ''} |`);
  }
  return lines.join('\n');
}

function renderCommand(cmd: OclifCommand, bin: string): string {
  const displayId = cmd.id.replace(/:/g, ' ');
  return [
    `### \`${bin} ${displayId}\``,
    '',
    cmd.description ?? '',
    '',
    renderFlags(cmd),
    '',
    '```bash',
    renderExample(cmd, bin),
    '```',
    '',
  ].join('\n');
}

function renderCatalog(manifest: OclifManifest, pkg: PackageJson): string {
  const bin = pkg.oclif.bin;
  const topicOrder = Object.keys(pkg.oclif.topics);
  const byTopic = new Map<string, OclifCommand[]>();
  for (const cmd of Object.values(manifest.commands)) {
    const topic = topicOf(cmd.id);
    if (!byTopic.has(topic)) byTopic.set(topic, []);
    byTopic.get(topic)!.push(cmd);
  }
  const out: string[] = [
    '# pega-dx Command Catalog (generated)',
    '',
    '> Auto-generated from `oclif.manifest.json`. Do not edit by hand.',
    '> Regenerate with `npm run generate:skill-catalog`.',
    '',
  ];
  for (const topic of topicOrder) {
    const cmds = (byTopic.get(topic) ?? []).sort((a, b) => a.id.localeCompare(b.id));
    if (cmds.length === 0) continue;
    out.push(`## ${topic}`);
    out.push('');
    for (const cmd of cmds) {
      out.push(renderCommand(cmd, bin));
    }
  }
  return out.join('\n');
}

function rewriteVersion(skillContent: string, version: string): string {
  return skillContent.replace(/^version:.*$/m, `version: ${version}`);
}

export function generateSkillCatalog(opts: GenerateOpts): GenerateResult {
  const manifestPath = path.join(opts.repoRoot, 'oclif.manifest.json');
  const pkgPath = path.join(opts.repoRoot, 'package.json');
  const skillPath = path.join(opts.repoRoot, 'skills/pega-dx/SKILL.md');
  const catalogPath = path.join(opts.repoRoot, 'skills/pega-dx/references/command-catalog.md');

  const manifest = readJson<OclifManifest>(manifestPath);
  const pkg = readJson<PackageJson>(pkgPath);
  const catalog = renderCatalog(manifest, pkg);
  const skill = rewriteVersion(fs.readFileSync(skillPath, 'utf8'), pkg.version);

  const existingCatalog = fs.existsSync(catalogPath) ? fs.readFileSync(catalogPath, 'utf8') : '';
  const existingSkill = fs.readFileSync(skillPath, 'utf8');
  const changed = existingCatalog !== catalog || existingSkill !== skill;

  if (opts.mode === 'write' && changed) {
    fs.mkdirSync(path.dirname(catalogPath), { recursive: true });
    fs.writeFileSync(catalogPath, catalog);
    fs.writeFileSync(skillPath, skill);
  }

  return { changed, files: ['skills/pega-dx/SKILL.md', 'skills/pega-dx/references/command-catalog.md'] };
}

// CLI entry
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const mode = process.argv.includes('--check') ? 'check' : 'write';
  const repoRoot = process.cwd();
  const res = generateSkillCatalog({ repoRoot, mode });
  if (mode === 'check' && res.changed) {
    process.stderr.write('skill-catalog: out of date. Run `npm run generate:skill-catalog`.\n');
    process.exit(1);
  }
  if (mode === 'write' && res.changed) {
    process.stdout.write(`skill-catalog: regenerated ${res.files.length} file(s).\n`);
  }
}
