import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { composeMutationBody, type MutationBodyFlags } from '../../lib/input.js';

export const __endpoint = {
  path: '/assignments/{assignmentID}/actions/{actionID}/save',
  method: 'PATCH',
} as const;

export default class AssignmentsSave extends BaseCommand {
  static override description = 'Save a draft of an in-progress assignment';
  static override examples = [
    '<%= config.bin %> assignments save ASSIGN-1 --action Submit --data @draft.json',
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
    attachments: Flags.string({
      description: 'JSON attachments array (inline, @file, or -)',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AssignmentsSave);
    const baseFlags = flags as unknown as BaseFlags;
    let body: Record<string, unknown> = {};
    try {
      body = await composeMutationBody(flags as MutationBodyFlags, 'action');
    } catch (err) {
      this.fail(err);
    }
    const encId = encodeURIComponent(args.assignmentId);
    const encAction = encodeURIComponent(flags.action);
    await this.runMutateWithEtag(
      baseFlags,
      'PATCH',
      `/assignments/${encId}`,
      `/assignments/${encId}/actions/${encAction}/save`,
      body,
    );
  }
}
