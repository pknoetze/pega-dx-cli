import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { composeMutationBody, type MutationBodyFlags } from '../../lib/input.js';

export const __endpoint = {
  path: '/assignments/{assignmentID}/navigation_steps/previous',
  method: 'PATCH',
} as const;

export default class AssignmentsNavigateBack extends BaseCommand {
  static override description = 'Navigate back to the previous step in a multi-step assignment';
  static override examples = [
    '<%= config.bin %> assignments navigate-back ASSIGN-1',
    "<%= config.bin %> assignments navigate-back ASSIGN-1 --data '{\"x\":1}'",
  ];
  static override args = {
    assignmentId: Args.string({ required: true, description: 'Assignment ID' }),
  };
  static override flags = {
    data: Flags.string({ description: 'JSON content (inline, @file, or -)' }),
    'page-instructions': Flags.string({
      description: 'JSON page-instructions array (inline, @file, or -)',
    }),
    attachments: Flags.string({
      description: 'JSON attachments array (inline, @file, or -)',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AssignmentsNavigateBack);
    const baseFlags = flags as unknown as BaseFlags;
    let body: Record<string, unknown> = {};
    try {
      body = await composeMutationBody(flags as MutationBodyFlags, 'navigate');
    } catch (err) {
      this.fail(err);
    }
    const encId = encodeURIComponent(args.assignmentId);
    await this.runMutateWithEtag(
      baseFlags,
      'PATCH',
      `/assignments/${encId}`,
      `/assignments/${encId}/navigation_steps/previous`,
      body,
    );
  }
}
