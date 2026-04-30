import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class CasesGetView extends BaseCommand {
  static override description = 'Get a named view for a case';
  static override examples = ['<%= config.bin %> cases get-view MYAPP-CASE-1 --view Summary'];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    view: Flags.string({ required: true, description: 'View name' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CasesGetView);
    const encId = encodeURIComponent(args.caseId);
    const encView = encodeURIComponent(flags.view);
    await this.runGet(flags as unknown as BaseFlags, `/cases/${encId}/views/${encView}`);
  }
}
