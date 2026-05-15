import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/message-types/{type}',
  method: 'GET',
} as const;

export default class SocialGetMessageType extends BaseCommand {
  static override description = 'Get the create-form view metadata for a Pulse message type';
  static override examples = ['<%= config.bin %> social get-message-type Pulse-Post'];
  static override args = { type: Args.string({ required: true, description: 'Class ID of Message-type' }) };
  static override flags = {};

  async run(): Promise<void> {
    const { args, flags } = await this.parse(SocialGetMessageType);
    await this.runGet(
      flags as unknown as BaseFlags,
      `/message-types/${encodeURIComponent(args.type)}`,
    );
  }
}
