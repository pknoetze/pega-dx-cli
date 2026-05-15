import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/mention_types',
  method: 'GET',
} as const;

export default class SocialListMentionTypes extends BaseCommand {
  static override description = 'List Pulse mention types';
  static override examples = ['<%= config.bin %> social list-mention-types'];
  static override flags = {};

  async run(): Promise<void> {
    const { flags } = await this.parse(SocialListMentionTypes);
    await this.runGet(flags as unknown as BaseFlags, '/mention_types');
  }
}
