import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class CasesListStages extends BaseCommand {
  static override description = 'List stages for a case';
  static override examples = ['<%= config.bin %> cases list-stages MYAPP-CASE-1'];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CasesListStages);
    const encId = encodeURIComponent(args.caseId);
    await this.runGet(flags as unknown as BaseFlags, `/cases/${encId}/stages`);
  }
}
