import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { resolveSkillSource } from '../../skill/source.js';
import { listSkillTargets } from '../../skill/list-impl.js';

export default class SkillList extends BaseCommand {
  static override description = 'List available skill targets and resolved install paths';
  static override examples = ['<%= config.bin %> skill list'];
  static override flags = {};

  async run(): Promise<void> {
    const { flags } = await this.parse(SkillList);
    const baseFlags = flags as unknown as BaseFlags;
    const here = path.dirname(fileURLToPath(import.meta.url));
    const installRoot = path.resolve(here, '../../..');
    const sourceDir = resolveSkillSource({ installRoot, repoRoot: process.cwd() });
    const result = listSkillTargets({ sourceDir, home: os.homedir(), cwd: process.cwd() });
    this.emit(result, baseFlags);
  }
}
