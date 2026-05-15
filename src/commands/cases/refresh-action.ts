import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { composeMutationBody, type MutationBodyFlags } from '../../lib/input.js';

export const __endpoint = {
  path: '/cases/{caseID}/actions/{actionID}/refresh',
  method: 'PATCH',
} as const;

export default class CasesRefreshAction extends BaseCommand {
  static override description = 'Refresh a case action view (re-render form)';
  static override examples = [
    '<%= config.bin %> cases refresh-action MYAPP-CASE-1 --action Approve',
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
    'interest-page': Flags.string({
      description: "Embedded list row reference. Infinity '25+",
    }),
    'interest-page-action-id': Flags.string({
      description: "Action ID of the inner action. Infinity '25+",
    }),
    attachments: Flags.string({
      description: 'NOT ACCEPTED for refresh — INVALID_ARGS if passed',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CasesRefreshAction);
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
      `/cases/${encId}/actions/${encAction}/refresh`,
      body,
    );
  }
}
