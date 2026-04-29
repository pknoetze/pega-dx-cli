import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class AssignmentsGetAction extends BaseCommand {
  static override description = 'Get the action/view details for a specific action on an assignment';
  static override examples = ['<%= config.bin %> assignments get-action ASSIGN-1 --action Submit'];
  static override args = {
    assignmentId: Args.string({ required: true, description: 'Full assignment handle' }),
  };
  static override flags = {
    action: Flags.string({ required: true, description: 'Flow action ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AssignmentsGetAction);
    const encId = encodeURIComponent(args.assignmentId);
    const encAction = encodeURIComponent(flags.action);
    await this.runGet(
      flags as unknown as BaseFlags,
      `/assignments/${encId}/actions/${encAction}`,
    );
  }
}
