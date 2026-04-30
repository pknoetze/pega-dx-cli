import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class CasesListAncestors extends BaseCommand {
  static override description = 'List all ancestor cases in the case hierarchy';
  static override examples = ['<%= config.bin %> cases list-ancestors MYAPP-CASE-1'];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CasesListAncestors);
    const encId = encodeURIComponent(args.caseId);
    await this.runGet(flags as unknown as BaseFlags, `/cases/${encId}/ancestors`);
  }
}
