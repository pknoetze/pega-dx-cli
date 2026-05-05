import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class CaseTypesListBulkActions extends BaseCommand {
  static override description = 'List bulk actions for a case type (Launchpad only)';
  static override examples = [
    '<%= config.bin %> case-types list-bulk-actions Uplus-FS-Work-Loan',
  ];
  static override args = {
    caseTypeId: Args.string({ required: true, description: 'Case type ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CaseTypesListBulkActions);
    const enc = encodeURIComponent(args.caseTypeId);
    await this.runGet(flags as unknown as BaseFlags, `/casetypes/${enc}/bulk-actions`);
  }
}
