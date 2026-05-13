import { Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class RecentsList extends BaseCommand {
  static override description = "List the operator's recent items";
  static override examples = [
    '<%= config.bin %> recents list',
    '<%= config.bin %> recents list --max-results 20',
  ];
  static override flags = {
    'max-results': Flags.string({
      description: 'Maximum recents to fetch (≤0 returns all) (→ ?maxResultsToFetch=)',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(RecentsList);
    const baseFlags = flags as unknown as BaseFlags;
    let path = '/recents';
    if (flags['max-results'] !== undefined) {
      const params = new URLSearchParams({ maxResultsToFetch: flags['max-results'] });
      path = `${path}?${params.toString()}`;
    }
    await this.runGet(baseFlags, path);
  }
}
