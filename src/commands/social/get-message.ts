import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class SocialGetMessage extends BaseCommand {
  static override description = 'Get a Pulse message by ID';
  static override examples = ['<%= config.bin %> social get-message MSG-1'];
  static override args = { messageID: Args.string({ required: true, description: 'Message ID' }) };
  static override flags = {};

  async run(): Promise<void> {
    const { args, flags } = await this.parse(SocialGetMessage);
    await this.runGet(
      flags as unknown as BaseFlags,
      `/messages/${encodeURIComponent(args.messageID)}`,
    );
  }
}
