import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class CaseTypesList extends BaseCommand {
  static override description = 'List all available case types in the application';
  static override examples = ['<%= config.bin %> case-types list'];

  async run(): Promise<void> {
    const { flags } = await this.parse(CaseTypesList);
    await this.runGet(flags as unknown as BaseFlags, '/casetypes');
  }
}
