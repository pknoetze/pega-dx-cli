import * as path from 'node:path';

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
        const err: any = new Error('INVALID_ARGS: --dest is required when --target dir');
        err.code = 'INVALID_ARGS';
        throw err;
      }
      return { destination: opts.dest, format: 'dir' };
    }
    default: {
      const err: any = new Error(`INVALID_ARGS: unknown target ${String(target)}`);
      err.code = 'INVALID_ARGS';
      throw err;
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
