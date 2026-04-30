import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class CasesStageNext extends BaseCommand {
  static override description = 'Advance the case to the next stage';
  static override examples = ['<%= config.bin %> cases stage-next MYAPP-CASE-1'];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CasesStageNext);
    const encId = encodeURIComponent(args.caseId);
    await this.runMutateWithEtag(
      flags as unknown as BaseFlags,
      'POST',
      `/cases/${encId}`,
      `/cases/${encId}/stages/next`,
      {},
    );
  }
}
