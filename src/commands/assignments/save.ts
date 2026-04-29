import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { parseDataInput } from '../../lib/input.js';

export default class AssignmentsSave extends BaseCommand {
  static override description = 'Save a draft of an in-progress assignment without performing the action';
  static override examples = [
    '<%= config.bin %> assignments save ASSIGN-1 --action Submit',
    '<%= config.bin %> assignments save ASSIGN-1 --action Submit --data @form.json',
  ];
  static override args = {
    assignmentId: Args.string({ required: true, description: 'Full assignment handle' }),
  };
  static override flags = {
    action: Flags.string({ required: true, description: 'Flow action ID' }),
    data: Flags.string({ description: 'JSON content (inline, @file, or -)' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AssignmentsSave);
    const baseFlags = flags as unknown as BaseFlags;
    const body: Record<string, unknown> = {};
    if (flags.data) {
      try {
        body.content = await parseDataInput(flags.data);
      } catch (err) {
        this.fail(err);
      }
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
