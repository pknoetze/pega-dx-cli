import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class CasesDiscardUpdates extends BaseCommand {
  static override description = 'Release the case lock (discard pending updates)';
  static override examples = ['<%= config.bin %> cases discard-updates MYAPP-CASE-1'];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CasesDiscardUpdates);
    const encId = encodeURIComponent(args.caseId);
    await this.runDelete(flags as unknown as BaseFlags, `/cases/${encId}/updates`);
  }
}
