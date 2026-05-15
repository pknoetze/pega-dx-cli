import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/cases/{caseID}/stages/{stageID}',
  method: 'PUT',
} as const;

export default class CasesStageGo extends BaseCommand {
  static override description = 'Move the case to a specific named stage';
  static override examples = ['<%= config.bin %> cases stage-go MYAPP-CASE-1 --stage Resolution'];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    stage: Flags.string({ required: true, description: 'Stage name' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CasesStageGo);
    const encId = encodeURIComponent(args.caseId);
    const encStage = encodeURIComponent(flags.stage);
    await this.runMutateWithEtag(
      flags as unknown as BaseFlags,
      'PUT',
      `/cases/${encId}`,
      `/cases/${encId}/stages/${encStage}`,
      {},
    );
  }
}
