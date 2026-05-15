import { execa } from 'execa';
import { loadFixtures } from './fixtures.js';
import type { SmokeFixtures } from './types.js';

export interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function runCli(args: string[], opts: { input?: string } = {}): Promise<CliResult> {
  const profile = process.env.SMOKE_PROFILE ?? 'default';
  const full = [...args, '--profile', profile];
  const res = await execa('node', ['./bin/run.js', ...full], {
    input: opts.input,
    reject: false,
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });
  return { stdout: res.stdout, stderr: res.stderr, exitCode: res.exitCode ?? -1 };
}

export { loadFixtures };
export type { SmokeFixtures };
