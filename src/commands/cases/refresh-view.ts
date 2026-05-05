import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { composeMutationBody, type MutationBodyFlags } from '../../lib/input.js';

export default class CasesRefreshView extends BaseCommand {
  static override description = 'Refresh a named case view';
  static override examples = [
    '<%= config.bin %> cases refresh-view MYAPP-CASE-1 --view Summary',
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    view: Flags.string({ required: true, description: 'View name' }),
    data: Flags.string({ description: 'JSON content (inline, @file, or -)' }),
    'page-instructions': Flags.string({ description: 'JSON page-instructions array' }),
    'interest-page': Flags.string({ description: 'Embedded page reference (e.g. .PageList(1))' }),
    'interest-page-action-id': Flags.string({ description: 'Action ID of the inner action' }),
    attachments: Flags.string({
      description: 'NOT ACCEPTED — refresh-shape rejects attachments',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CasesRefreshView);
    const baseFlags = flags as unknown as BaseFlags;
    let body: Record<string, unknown> = {};
    try {
      body = await composeMutationBody(flags as MutationBodyFlags, 'refresh');
    } catch (err) {
      this.fail(err);
    }
    const encId = encodeURIComponent(args.caseId);
    const encView = encodeURIComponent(flags.view);
    await this.runMutateWithEtag(
      baseFlags,
      'PATCH',
      `/cases/${encId}`,
      `/cases/${encId}/views/${encView}/refresh`,
      body,
    );
  }
}
