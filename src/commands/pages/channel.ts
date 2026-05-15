import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/channels/{channelID}',
  method: 'GET',
} as const;

export default class PagesChannel extends BaseCommand {
  static override description = 'Get channel details by channel ID';
  static override examples = ['<%= config.bin %> pages channel MyChannel'];
  static override args = {
    channelID: Args.string({ required: true, description: 'Channel ID' }),
  };
  static override flags = {};

  async run(): Promise<void> {
    const { args, flags } = await this.parse(PagesChannel);
    await this.runGet(
      flags as unknown as BaseFlags,
      `/channels/${encodeURIComponent(args.channelID)}`,
    );
  }
}
