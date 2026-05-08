import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class DataListPages extends BaseCommand {
  static override description = 'List all data pages available in the application';
  static override examples = ['<%= config.bin %> data list-pages'];
  static override args = {};
  static override flags = {};

  async run(): Promise<void> {
    const { flags } = await this.parse(DataListPages);
    await this.runGet(flags as unknown as BaseFlags, '/data_pages');
  }
}
