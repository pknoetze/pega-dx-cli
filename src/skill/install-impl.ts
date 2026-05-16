import * as fs from 'node:fs';
import * as path from 'node:path';
import { resolveTargetDest, type SkillTarget } from './targets.js';
import { convertSkillToSingleFile, type SkillSource } from './convert.js';
import { SkillError } from './errors.js';

export interface InstallOpts {
  target: SkillTarget;
  sourceDir: string;
  home: string;
  cwd: string;
  force: boolean;
  dryRun: boolean;
  dest?: string;
}

export interface InstallResult {
  target: SkillTarget;
  destination: string;
  format: 'dir' | 'file';
  files: number;
  skillVersion: string;
  dryRun?: true;
}

function readSkillSource(dir: string): SkillSource & { version: string } {
  const skillMd = fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
  const versionMatch = skillMd.match(/^version:\s*(.+)$/m);
  const version = versionMatch?.[1]?.trim() ?? '0.0.0';
  const refsDir = path.join(dir, 'references');
  const references: Record<string, string> = {};
  for (const name of fs.readdirSync(refsDir)) {
    references[name] = fs.readFileSync(path.join(refsDir, name), 'utf8');
  }
  return { skillMd, references, version };
}

function walkFiles(dir: string): string[] {
  const out: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkFiles(p));
    else out.push(p);
  }
  return out;
}

function copyDir(src: string, dest: string): number {
  let count = 0;
  for (const file of walkFiles(src)) {
    const rel = path.relative(src, file);
    const target = path.join(dest, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(file, target);
    count++;
  }
  return count;
}

function rmRf(p: string): void {
  fs.rmSync(p, { recursive: true, force: true });
}

const MARKER_START = '<!-- pega-dx-skill:start -->';
const MARKER_END = '<!-- pega-dx-skill:end -->';

function installAgentsMd(content: string, existing: string | null, force: boolean): string {
  if (!existing) return content;
  if (existing.includes(MARKER_START) && existing.includes(MARKER_END)) {
    if (!force) {
      throw new SkillError(
        'INVALID_ARGS: AGENTS.md already contains pega-dx skill section; use --force to replace',
        'INVALID_ARGS',
      );
    }
    const re = new RegExp(
      `## Pega DX\\n${MARKER_START}[\\s\\S]*?${MARKER_END}\\n?`,
      'g',
    );
    return existing.replace(re, content);
  }
  return existing.replace(/\n*$/, '') + '\n\n' + content;
}

export function installSkill(opts: InstallOpts): InstallResult {
  const { destination, format } = resolveTargetDest(opts.target, {
    home: opts.home,
    cwd: opts.cwd,
    dest: opts.dest,
  });

  const source = readSkillSource(opts.sourceDir);

  if (opts.dryRun) {
    return {
      target: opts.target,
      destination,
      format,
      files: format === 'dir' ? walkFiles(opts.sourceDir).length : 1,
      skillVersion: source.version,
      dryRun: true,
    };
  }

  if (format === 'dir') {
    if (fs.existsSync(destination)) {
      if (!opts.force) {
        throw new SkillError(
          `INVALID_ARGS: destination already exists: ${destination} (use --force)`,
          'INVALID_ARGS',
        );
      }
      rmRf(destination);
    }
    fs.mkdirSync(destination, { recursive: true });
    const files = copyDir(opts.sourceDir, destination);
    return { target: opts.target, destination, format, files, skillVersion: source.version };
  }

  // file format
  if (opts.target === 'agents-md') {
    const existing = fs.existsSync(destination) ? fs.readFileSync(destination, 'utf8') : null;
    const payload = convertSkillToSingleFile({ source, target: 'agents-md' });
    const next = installAgentsMd(payload, existing, opts.force);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, next);
    return { target: opts.target, destination, format, files: 1, skillVersion: source.version };
  }

  if (fs.existsSync(destination) && !opts.force) {
    throw new SkillError(
      `INVALID_ARGS: destination already exists: ${destination} (use --force)`,
      'INVALID_ARGS',
    );
  }
  const convertTarget = opts.target as 'cursor' | 'continue' | 'windsurf';
  const payload = convertSkillToSingleFile({ source, target: convertTarget });
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, payload);
  return { target: opts.target, destination, format, files: 1, skillVersion: source.version };
}
