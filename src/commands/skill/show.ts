import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { resolveSkillSource } from '../../skill/source.js';
import { readSkillSection } from '../../skill/show-impl.js';

export default class SkillShow extends BaseCommand {
  static override description = 'Print the SKILL.md body or a named reference to stdout';
  static override examples = [
    '<%= config.bin %> skill show',
    '<%= config.bin %> skill show case-lifecycle',
  ];

  static override args = {
    section: Args.string({ description: 'Reference section name (e.g. case-lifecycle)' }),
  };

  static override flags = {};

  async run(): Promise<void> {
    const { args, flags, metadata } = await this.parse(SkillShow);
    const baseFlags = flags as unknown as BaseFlags;
    const here = path.dirname(fileURLToPath(import.meta.url));
    const installRoot = path.resolve(here, '../../..');
    const sourceDir = resolveSkillSource({ installRoot, repoRoot: process.cwd() });
    try {
      const res = readSkillSection({ sourceDir, section: args.section });
      // Only emit structured output when --format is explicitly provided (not set from default)
      const formatExplicit = !metadata.flags['format']?.setFromDefault;
      if (formatExplicit) {
        this.emit(res, baseFlags);
      } else {
        process.stdout.write(res.content);
        if (!res.content.endsWith('\n')) process.stdout.write('\n');
      }
    } catch (err) {
      this.fail(err);
    }
  }
}
