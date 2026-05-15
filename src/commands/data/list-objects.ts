import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/data_objects',
  method: 'GET',
} as const;

export default class DataListObjects extends BaseCommand {
  static override description = 'List all data objects available in the application';
  static override examples = ['<%= config.bin %> data list-objects'];
  static override args = {};
  static override flags = {};

  async run(): Promise<void> {
    const { flags } = await this.parse(DataListObjects);
    await this.runGet(flags as unknown as BaseFlags, '/data_objects');
  }
}
