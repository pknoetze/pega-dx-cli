import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

export function extractReleaseNotes(changelog: string, version: string): string | null {
  const v = version.replace(/^v/, '');
  const headerRe = new RegExp(`^## \\[${v.replace(/\./g, '\\.')}\\][^\\n]*$`, 'm');
  const headerMatch = headerRe.exec(changelog);
  if (!headerMatch) return null;
  const startIndex = headerMatch.index + headerMatch[0].length;
  const rest = changelog.slice(startIndex);
  const nextHeader = /^## \[/m.exec(rest);
  const body = nextHeader ? rest.slice(0, nextHeader.index) : rest;
  // Collapse runs of blank lines at start/end to single newline so GitHub Release body renders cleanly
  return body.replace(/^\n\n+/, '\n').replace(/\n\n+$/, '\n');
}

// ESM-compatible CLI entry detection (matches established pattern in scripts/)
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
  const version = process.argv[2];
  if (!version) {
    console.error('Usage: node --loader ts-node/esm scripts/extract-release-notes.ts <version>');
    process.exit(2);
  }
  const text = fs.readFileSync('CHANGELOG.md', 'utf8');
  const body = extractReleaseNotes(text, version);
  if (body === null) {
    console.error(`No section for ${version} in CHANGELOG.md`);
    process.exit(1);
  }
  process.stdout.write(body.trim() + '\n');
}
