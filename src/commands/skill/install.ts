import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { resolveSkillSource } from '../../skill/source.js';
import { installSkill } from '../../skill/install-impl.js';
import { SKILL_TARGETS, type SkillTarget } from '../../skill/targets.js';

export default class SkillInstall extends BaseCommand {
  static override description =
    'Install the pega-dx agent skill into the right location for your AI tool. Note: --profile is ignored — this command makes no API calls.';

  static override examples = [
    '<%= config.bin %> skill install',
    '<%= config.bin %> skill install --target cursor',
    '<%= config.bin %> skill install --target dir --dest ./skills/pega-dx',
    '<%= config.bin %> skill install --target claude-code --force',
  ];

  static override flags = {
    target: Flags.string({
      description: 'Where to install the skill',
      options: [...SKILL_TARGETS],
      default: 'claude-code',
    }),
    dest: Flags.string({
      description: 'Destination path (required when --target dir)',
    }),
    force: Flags.boolean({
      description: 'Overwrite existing destination',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SkillInstall);
    const baseFlags = flags as unknown as BaseFlags;

    const here = path.dirname(fileURLToPath(import.meta.url));
    const installRoot = path.resolve(here, '../../..');
    const repoRoot = process.cwd();
    const sourceDir = resolveSkillSource({ installRoot, repoRoot });

    try {
      const result = installSkill({
        target: flags.target as SkillTarget,
        sourceDir,
        home: os.homedir(),
        cwd: process.cwd(),
        force: flags.force,
        dryRun: baseFlags['dry-run'] ?? false,
        dest: flags.dest,
      });
      this.emit(result, baseFlags);
    } catch (err) {
      this.fail(err);
    }
  }
}
