import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/insight/{insightID}',
  method: 'GET',
} as const;

export default class PagesInsight extends BaseCommand {
  static override description = 'Get page details for displaying an Insight';
  static override examples = ['<%= config.bin %> pages insight MyInsight'];
  static override args = {
    insightID: Args.string({ required: true, description: 'Insight ID' }),
  };
  static override flags = {};

  async run(): Promise<void> {
    const { args, flags } = await this.parse(PagesInsight);
    await this.runGet(
      flags as unknown as BaseFlags,
      `/insight/${encodeURIComponent(args.insightID)}`,
    );
  }
}
