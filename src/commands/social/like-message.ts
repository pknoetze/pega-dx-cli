import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class SocialLikeMessage extends BaseCommand {
  static override description = 'Add a like to a Pulse message';
  static override examples = ['<%= config.bin %> social like-message MSG-1'];
  static override args = { messageID: Args.string({ required: true, description: 'Message ID' }) };
  static override flags = {};

  async run(): Promise<void> {
    const { args, flags } = await this.parse(SocialLikeMessage);
    await this.runPost(
      flags as unknown as BaseFlags,
      `/messages/${encodeURIComponent(args.messageID)}/likes`,
      undefined,
    );
  }
}
