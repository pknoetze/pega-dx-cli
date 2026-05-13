import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class SocialListLikes extends BaseCommand {
  static override description = 'List likes on a Pulse message';
  static override examples = ['<%= config.bin %> social list-likes MSG-1'];
  static override args = { messageID: Args.string({ required: true, description: 'Message ID' }) };
  static override flags = {};

  async run(): Promise<void> {
    const { args, flags } = await this.parse(SocialListLikes);
    await this.runGet(
      flags as unknown as BaseFlags,
      `/messages/${encodeURIComponent(args.messageID)}/likes`,
    );
  }
}
