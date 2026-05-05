import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { composeMutationBody, type MutationBodyFlags } from '../../lib/input.js';

export default class AssignmentsRefreshAction extends BaseCommand {
  static override description = 'Refresh a field after a value change';
  static override examples = [
    "<%= config.bin %> assignments refresh-action ASSIGN-1 --action Submit --data '{\"field\":\"new\"}'",
    '<%= config.bin %> assignments refresh-action ASSIGN-1 --action Submit --interest-page .OrderItems(1) --interest-page-action-id EmbeddedAction',
  ];
  static override args = {
    assignmentId: Args.string({ required: true, description: 'Assignment ID' }),
  };
  static override flags = {
    action: Flags.string({ required: true, description: 'Action ID' }),
    data: Flags.string({ description: 'JSON content (inline, @file, or -)' }),
    'page-instructions': Flags.string({
      description: 'JSON page-instructions array (inline, @file, or -)',
    }),
    'interest-page': Flags.string({
      description: "Embedded list row reference (e.g. .OrderItems(1)). Infinity '25+",
    }),
    'interest-page-action-id': Flags.string({
      description: "Action ID of the inner ('interest page') action. Infinity '25+",
    }),
    attachments: Flags.string({
      description: 'NOT ACCEPTED for refresh (use perform-action or save instead). Errors with INVALID_ARGS.',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AssignmentsRefreshAction);
    const baseFlags = flags as unknown as BaseFlags;
    let body: Record<string, unknown> = {};
    try {
      body = await composeMutationBody(flags as MutationBodyFlags, 'refresh');
    } catch (err) {
      this.fail(err);
    }
    const encId = encodeURIComponent(args.assignmentId);
    const encAction = encodeURIComponent(flags.action);
    await this.runMutateWithEtag(
      baseFlags,
      'PATCH',
      `/assignments/${encId}`,
      `/assignments/${encId}/actions/${encAction}/refresh`,
      body,
    );
  }
}
