import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { composeMutationBody, type MutationBodyFlags } from '../../lib/input.js';

export const __endpoint = {
  path: '/assignments/{assignmentID}/navigation_steps/{stepID}',
  method: 'PATCH',
} as const;

export default class AssignmentsNavigateToStep extends BaseCommand {
  static override description = 'Navigate to a specific step in a multi-step assignment';
  static override examples = [
    '<%= config.bin %> assignments navigate-to-step ASSIGN-1 --step Step3',
  ];
  static override args = {
    assignmentId: Args.string({ required: true, description: 'Assignment ID' }),
  };
  static override flags = {
    step: Flags.string({ required: true, description: 'Step ID' }),
    data: Flags.string({ description: 'JSON content (inline, @file, or -)' }),
    'page-instructions': Flags.string({ description: 'JSON page-instructions array' }),
    attachments: Flags.string({ description: 'JSON attachments array' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AssignmentsNavigateToStep);
    const baseFlags = flags as unknown as BaseFlags;
    let body: Record<string, unknown> = {};
    try {
      body = await composeMutationBody(flags as MutationBodyFlags, 'navigate');
    } catch (err) {
      this.fail(err);
    }
    const encId = encodeURIComponent(args.assignmentId);
    const encStep = encodeURIComponent(flags.step);
    await this.runMutateWithEtag(
      baseFlags,
      'PATCH',
      `/assignments/${encId}`,
      `/assignments/${encId}/navigation_steps/${encStep}`,
      body,
    );
  }
}
