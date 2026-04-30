import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { parseDataInput } from '../../lib/input.js';

export default class CasesPerformAction extends BaseCommand {
  static override description = 'Perform a case-level action';
  static override examples = [
    '<%= config.bin %> cases perform-action MYAPP-CASE-1 --action Approve',
    '<%= config.bin %> cases perform-action MYAPP-CASE-1 --action Approve --data @form.json',
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    action: Flags.string({ required: true, description: 'Case action ID' }),
    data: Flags.string({ description: 'JSON content (inline, @file, or -)' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CasesPerformAction);
    const baseFlags = flags as unknown as BaseFlags;
    const body: Record<string, unknown> = {};
    if (flags.data) {
      try {
        body.content = await parseDataInput(flags.data);
      } catch (err) {
        this.fail(err);
      }
    }
    const encId = encodeURIComponent(args.caseId);
    const encAction = encodeURIComponent(flags.action);
    await this.runMutateWithEtag(
      baseFlags,
      'PATCH',
      `/cases/${encId}`,
      `/cases/${encId}/actions/${encAction}`,
      body,
    );
  }
}
