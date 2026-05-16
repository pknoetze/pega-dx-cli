import * as fs from 'node:fs';
import * as path from 'node:path';
import { listTargets, type SkillTarget } from './targets.js';

export interface ListResult {
  skillVersion: string;
  targets: Array<{ target: SkillTarget; destination: string; format: 'dir' | 'file' }>;
}

export function listSkillTargets(opts: { sourceDir: string; home: string; cwd: string }): ListResult {
  const skillMd = fs.readFileSync(path.join(opts.sourceDir, 'SKILL.md'), 'utf8');
  const versionMatch = skillMd.match(/^version:\s*(.+)$/m);
  const skillVersion = versionMatch?.[1]?.trim() ?? '0.0.0';
  return { skillVersion, targets: listTargets({ home: opts.home, cwd: opts.cwd }) };
}
