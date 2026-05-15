import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/messages/{messageID}/likes',
  method: 'DELETE',
} as const;

export default class SocialUnlikeMessage extends BaseCommand {
  static override description = 'Remove a like from a Pulse message';
  static override examples = ['<%= config.bin %> social unlike-message MSG-1'];
  static override args = { messageID: Args.string({ required: true, description: 'Message ID' }) };
  static override flags = {};

  async run(): Promise<void> {
    const { args, flags } = await this.parse(SocialUnlikeMessage);
    await this.runDelete(
      flags as unknown as BaseFlags,
      `/messages/${encodeURIComponent(args.messageID)}/likes`,
    );
  }
}
