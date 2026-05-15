import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extractSpecOperations,
  extractCommandEndpoints,
  type SpecOperation,
  type CommandEndpoint,
} from './lib/endpoint-extractor.js';

export interface AuditResult {
  ok: number;
  missing: SpecOperation[];
  drift: CommandEndpoint[];
  cliOnly: CommandEndpoint[];
  exitCode: 0 | 1;
}

export function runAudit(opts: {
  specPath: string;
  commandsRoot: string;
  outputPath: string;
}): AuditResult {
  const { version, operations: spec } = extractSpecOperations(opts.specPath);
  const cmds = extractCommandEndpoints(opts.commandsRoot);

  const specKey = (o: { path: string; method: string }) => `${o.method} ${o.path}`;
  const specSet = new Map(spec.map((o) => [specKey(o), o]));
  const cmdSet = new Map<string, CommandEndpoint>();
  const cliOnly: CommandEndpoint[] = [];

  for (const c of cmds) {
    if (c.path === null || c.method === null) {
      cliOnly.push(c);
    } else {
      cmdSet.set(specKey({ path: c.path, method: c.method }), c);
    }
  }

  const missing = spec.filter((o) => !cmdSet.has(specKey(o)));
  const drift: CommandEndpoint[] = [];
  for (const [key, c] of cmdSet) {
    if (!specSet.has(key)) drift.push(c);
  }
  const ok = spec.length - missing.length;

  const md = renderCoverageDoc({ version, spec, cmds: cmdSet, missing, drift, cliOnly });
  fs.mkdirSync(path.dirname(opts.outputPath), { recursive: true });
  fs.writeFileSync(opts.outputPath, md);

  return { ok, missing, drift, cliOnly, exitCode: missing.length + drift.length === 0 ? 0 : 1 };
}

function renderCoverageDoc(args: {
  version: string;
  spec: SpecOperation[];
  cmds: Map<string, CommandEndpoint>;
  missing: SpecOperation[];
  drift: CommandEndpoint[];
  cliOnly: CommandEndpoint[];
}): string {
  const { version, spec, cmds, missing, drift, cliOnly } = args;
  const lines: string[] = [];
  lines.push(`# Pega DX API v${version} — Coverage Matrix`);
  lines.push('');
  lines.push(
    `Generated: ${new Date().toISOString()}. Source: \`dx-api.yaml\`. Total operations: ${spec.length}.`
  );
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  const okCount = spec.length - missing.length;
  lines.push(
    `- Implemented: ${okCount} / ${spec.length} (${((okCount / spec.length) * 100).toFixed(1)}%)`
  );
  lines.push(`- Missing: ${missing.length}`);
  lines.push(`- Drift: ${drift.length}`);
  lines.push('');
  lines.push('## Endpoint → Command Map');
  lines.push('');
  lines.push('| Method | Path | Command | Source |');
  lines.push('|---|---|---|---|');
  for (const op of [...spec].sort((a, b) =>
    a.path === b.path ? a.method.localeCompare(b.method) : a.path.localeCompare(b.path)
  )) {
    const c = cmds.get(`${op.method} ${op.path}`);
    const command = c ? '`' + commandFromFile(c.file) + '`' : '**MISSING**';
    const source = c ? '`' + relSource(c.file) + '`' : '—';
    lines.push(`| ${op.method} | \`${op.path}\` | ${command} | ${source} |`);
  }
  lines.push('');
  if (drift.length) {
    lines.push('## Drift (command declares an endpoint not in spec)');
    lines.push('');
    lines.push('| Method | Path | Source |');
    lines.push('|---|---|---|');
    for (const d of drift) lines.push(`| ${d.method} | \`${d.path}\` | \`${relSource(d.file)}\` |`);
    lines.push('');
  }
  if (cliOnly.length) {
    lines.push('## CLI-only commands (informational)');
    lines.push('');
    lines.push('These commands have no direct DX API mapping (auth, diagnostics, etc.).');
    lines.push('');
    lines.push('| Command | Source |');
    lines.push('|---|---|');
    for (const c of cliOnly) lines.push(`| \`${commandFromFile(c.file)}\` | \`${relSource(c.file)}\` |`);
    lines.push('');
  }
  return lines.join('\n');
}

function commandFromFile(file: string): string {
  const m = file.match(/commands[/\\](.+)\.ts$/);
  if (!m || !m[1]) return file;
  return 'pega ' + m[1].replace(/[/\\]/g, ' ');
}

function relSource(file: string): string {
  const idx = file.indexOf('src/commands');
  return idx >= 0 ? file.slice(idx) : file;
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
  const result = runAudit({
    specPath: path.resolve(process.cwd(), 'dx-api.yaml'),
    commandsRoot: path.resolve(process.cwd(), 'src/commands'),
    outputPath: path.resolve(process.cwd(), 'reference/api-coverage.md'),
  });
  console.log(`Spec operations: ${result.ok + result.missing.length}`);
  console.log(`  OK:      ${result.ok}`);
  console.log(`  MISSING: ${result.missing.length}`);
  console.log(`  DRIFT:   ${result.drift.length}`);
  console.log(`  CLI-only (informational): ${result.cliOnly.length}`);
  if (result.missing.length) {
    console.log('\nMissing operations:');
    for (const m of result.missing) console.log(`  ${m.method} ${m.path}`);
  }
  if (result.drift.length) {
    console.log('\nDrift:');
    for (const d of result.drift) console.log(`  ${d.method} ${d.path}  (${d.file})`);
  }
  process.exit(result.exitCode);
}
