import { Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class RecentsUpdate extends BaseCommand {
  static override description = 'Add or update a recent item';
  static override examples = ['<%= config.bin %> recents update --label "My Case" --id MYORG-WORK\\!M-1'];
  static override flags = {
    label: Flags.string({ required: true, description: 'pyLabel value' }),
    id: Flags.string({ required: true, description: 'pyID value' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(RecentsUpdate);
    await this.runPatch(
      flags as unknown as BaseFlags,
      '/recents',
      { pyLabel: flags.label, pyID: flags.id },
    );
  }
}
