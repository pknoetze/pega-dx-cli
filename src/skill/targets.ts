import * as path from 'node:path';
import { SkillError } from './errors.js';

export const SKILL_TARGETS = [
  'claude-code',
  'claude-project',
  'cursor',
  'continue',
  'windsurf',
  'agents-md',
  'dir',
] as const;
export type SkillTarget = (typeof SKILL_TARGETS)[number];

export interface ResolveDestOpts {
  home: string;
  cwd: string;
  dest?: string;
}

export interface ResolvedDest {
  destination: string;
  format: 'dir' | 'file';
}

export function resolveTargetDest(target: SkillTarget, opts: ResolveDestOpts): ResolvedDest {
  switch (target) {
    case 'claude-code':
      return { destination: path.join(opts.home, '.claude/skills/pega-dx'), format: 'dir' };
    case 'claude-project':
      return { destination: path.join(opts.cwd, '.claude/skills/pega-dx'), format: 'dir' };
    case 'cursor':
      return { destination: path.join(opts.cwd, '.cursor/rules/pega-dx.mdc'), format: 'file' };
    case 'continue':
      return { destination: path.join(opts.cwd, '.continue/rules/pega-dx.md'), format: 'file' };
    case 'windsurf':
      return { destination: path.join(opts.cwd, '.windsurf/rules/pega-dx.md'), format: 'file' };
    case 'agents-md':
      return { destination: path.join(opts.cwd, 'AGENTS.md'), format: 'file' };
    case 'dir': {
      if (!opts.dest) {
        throw new SkillError('INVALID_ARGS: --dest is required when --target dir', 'INVALID_ARGS');
      }
      return { destination: opts.dest, format: 'dir' };
    }
    default: {
      throw new SkillError(`INVALID_ARGS: unknown target ${String(target)}`, 'INVALID_ARGS');
    }
  }
}

export function listTargets(opts: { home: string; cwd: string }): Array<ResolvedDest & { target: SkillTarget }> {
  return SKILL_TARGETS.map(target => {
    if (target === 'dir') {
      return { target, destination: '<--dest required>', format: 'dir' as const };
    }
    return { target, ...resolveTargetDest(target, opts) };
  });
}
