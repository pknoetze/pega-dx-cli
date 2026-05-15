import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { composeMutationBody, type MutationBodyFlags } from '../../lib/input.js';

export const __endpoint = {
  path: '/cases/{caseID}/actions/{actionID}',
  method: 'PATCH',
} as const;

export default class CasesPerformAction extends BaseCommand {
  static override description = 'Perform a case-level action';
  static override examples = [
    '<%= config.bin %> cases perform-action MYAPP-CASE-1 --action Approve',
    "<%= config.bin %> cases perform-action MYAPP-CASE-1 --action Approve --data '{\"reason\":\"OK\"}'",
    '<%= config.bin %> cases perform-action MYAPP-CASE-1 --action Approve --data @form.json --page-instructions @pi.json',
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    action: Flags.string({ required: true, description: 'Case action ID' }),
    data: Flags.string({ description: 'JSON content (inline, @file, or -)' }),
    'page-instructions': Flags.string({
      description: 'JSON page-instructions array (inline, @file, or -)',
    }),
    attachments: Flags.string({
      description: 'JSON attachments array (inline, @file, or -)',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CasesPerformAction);
    const baseFlags = flags as unknown as BaseFlags;
    let body: Record<string, unknown> = {};
    try {
      body = await composeMutationBody(flags as MutationBodyFlags, 'action');
    } catch (err) {
      this.fail(err);
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
