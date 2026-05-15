import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/cases/{caseID}/processes/{processID}',
  method: 'POST',
} as const;

export default class CasesStartProcess extends BaseCommand {
  static override description = 'Start an optional or stage process on a case';
  static override examples = [
    '<%= config.bin %> cases start-process MYAPP-CASE-1 --process pyAddNote',
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    process: Flags.string({ required: true, description: 'Process ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CasesStartProcess);
    const encCaseId = encodeURIComponent(args.caseId);
    const encProcess = encodeURIComponent(flags.process);
    // PDF page 435: "The endpoint doesn't accept any content as the request body."
    await this.runPost(
      flags as unknown as BaseFlags,
      `/cases/${encCaseId}/processes/${encProcess}`,
      undefined,
    );
  }
}
