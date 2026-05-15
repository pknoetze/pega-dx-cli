import { Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/cases/bulk-actions',
  method: 'POST',
} as const;

export default class CasesBulkActions extends BaseCommand {
  static override description = 'List bulk actions available across a set of cases';
  static override examples = [
    '<%= config.bin %> cases bulk-actions --cases CASE-1,CASE-2,CASE-3',
  ];
  static override flags = {
    cases: Flags.string({
      required: true,
      description: 'Comma-separated case IDs',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(CasesBulkActions);
    const ids = flags.cases.split(',').map((s) => s.trim()).filter(Boolean);
    const body = { cases: ids.map((ID) => ({ ID })) };
    await this.runPost(flags as unknown as BaseFlags, '/cases/bulk-actions', body);
  }
}
