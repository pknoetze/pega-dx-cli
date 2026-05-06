import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { parseDataInput } from '../../lib/input.js';

export default class AssignmentsRecalculate extends BaseCommand {
  static override description = 'Recalculate calculated fields and when conditions for an assignment action';
  static override examples = [
    '<%= config.bin %> assignments recalculate ASSIGN-1 --action Submit --data \'{"calculations":{"fields":[{"name":".Total","context":"content"}]}}\'',
  ];
  static override args = {
    assignmentId: Args.string({ required: true, description: 'Assignment ID' }),
  };
  static override flags = {
    action: Flags.string({ required: true, description: 'Action ID' }),
    data: Flags.string({
      required: true,
      description:
        'JSON: {calculations:{fields:[{name:".X",context:"content"}]}} (inline, @file, or -)',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AssignmentsRecalculate);
    const baseFlags = flags as unknown as BaseFlags;
    let body: unknown = undefined;
    try {
      body = await parseDataInput(flags.data);
    } catch (err) {
      this.fail(err);
    }
    const encId = encodeURIComponent(args.assignmentId);
    const encAction = encodeURIComponent(flags.action);
    await this.runMutateWithEtag(
      baseFlags,
      'PATCH',
      `/assignments/${encId}`,
      `/assignments/${encId}/actions/${encAction}/recalculate`,
      body,
    );
  }
}
