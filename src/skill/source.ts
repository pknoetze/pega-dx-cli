import * as fs from 'node:fs';
import * as path from 'node:path';
import { SkillError } from './errors.js';

export interface ResolveSourceOpts {
  installRoot?: string;
  repoRoot?: string;
}

export function resolveSkillSource(opts: ResolveSourceOpts = {}): string {
  const candidates: string[] = [];
  if (opts.installRoot) candidates.push(path.join(opts.installRoot, 'skills/pega-dx'));
  if (opts.repoRoot) candidates.push(path.join(opts.repoRoot, 'skills/pega-dx'));
  for (const c of candidates) {
    try {
      if (fs.statSync(c).isDirectory()) return c;
    } catch {
      /* keep looking */
    }
  }
  throw new SkillError('Cannot locate skills/pega-dx source [INVALID_CONFIG]', 'INVALID_CONFIG');
}
