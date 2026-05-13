import { Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class SocialListSuggestedTags extends BaseCommand {
  static override description = 'List suggested + recent tags for a Pulse context';
  static override examples = ['<%= config.bin %> social list-suggested-tags --context MYORG-WORK\\!M-1'];
  static override flags = {
    context: Flags.string({ description: '→ ?context=' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SocialListSuggestedTags);
    const baseFlags = flags as unknown as BaseFlags;
    let path = '/suggested_tags';
    if (flags.context !== undefined) {
      const params = new URLSearchParams({ context: flags.context });
      path = `${path}?${params.toString()}`;
    }
    await this.runGet(baseFlags, path);
  }
}
