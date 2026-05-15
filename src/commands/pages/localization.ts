import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/localizations/{locale}',
  method: 'GET',
} as const;

export default class PagesLocalization extends BaseCommand {
  static override description = 'Get locale bundle by locale name';
  static override examples = ['<%= config.bin %> pages localization en_US'];
  static override args = {
    locale: Args.string({ required: true, description: 'Locale bundle name (e.g. en_US)' }),
  };
  static override flags = {};

  async run(): Promise<void> {
    const { args, flags } = await this.parse(PagesLocalization);
    await this.runGet(
      flags as unknown as BaseFlags,
      `/localizations/${encodeURIComponent(args.locale)}`,
    );
  }
}
