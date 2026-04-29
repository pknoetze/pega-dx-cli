import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class AssignmentsNavigateBack extends BaseCommand {
  static override description = 'Navigate back to the previous screen in a multi-step assignment';
  static override examples = ['<%= config.bin %> assignments navigate-back ASSIGN-1'];
  static override args = {
    assignmentId: Args.string({ required: true, description: 'Full assignment handle' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AssignmentsNavigateBack);
    const encId = encodeURIComponent(args.assignmentId);
    await this.runMutateWithEtag(
      flags as unknown as BaseFlags,
      'PATCH',
      `/assignments/${encId}`,
      `/assignments/${encId}/navigation_steps/previous`,
      {},
    );
  }
}
