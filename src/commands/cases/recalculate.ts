import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { composeMutationBody, type MutationBodyFlags } from '../../lib/input.js';

// TODO: confirm body shape against real Pega in Task 15.
// PDF does not document this endpoint; using sibling-of-refresh shape (refresh-shape).
export default class CasesRecalculate extends BaseCommand {
  static override description = 'Recalculate calculated fields and when conditions for a case action';
  static override examples = [
    '<%= config.bin %> cases recalculate MYAPP-CASE-1 --action Approve',
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
    'interest-page': Flags.string({ description: 'Embedded list row reference' }),
    'interest-page-action-id': Flags.string({ description: 'Action ID of the inner action' }),
    attachments: Flags.string({
      description: 'NOT ACCEPTED — refresh-shape rejects attachments',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CasesRecalculate);
    const baseFlags = flags as unknown as BaseFlags;
    let body: Record<string, unknown> = {};
    try {
      body = await composeMutationBody(flags as MutationBodyFlags, 'refresh');
    } catch (err) {
      this.fail(err);
    }
    const encId = encodeURIComponent(args.caseId);
    const encAction = encodeURIComponent(flags.action);
    await this.runMutateWithEtag(
      baseFlags,
      'PATCH',
      `/cases/${encId}`,
      `/cases/${encId}/actions/${encAction}/recalculate`,
      body,
    );
  }
}
