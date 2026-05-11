import { Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class DataListPages extends BaseCommand {
  static override description = 'List data pages available in the application';
  static override examples = [
    '<%= config.bin %> data list-pages',
    '<%= config.bin %> data list-pages --type explorable',
  ];
  static override args = {};
  static override flags = {
    type: Flags.string({
      description: 'Data page request type',
      options: ['all', 'explorable'],
      default: 'all',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DataListPages);
    await this.runGet(flags as unknown as BaseFlags, `/data_pages?type=${flags.type}`);
  }
}
