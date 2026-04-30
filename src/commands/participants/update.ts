import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { parseDataInput } from '../../lib/input.js';

export default class ParticipantsUpdate extends BaseCommand {
  static override description = "Update a participant's details";
  static override examples = [
    '<%= config.bin %> participants update MYAPP-CASE-1 --role Owner --data @owner.json',
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    role: Flags.string({ required: true, description: 'Participant role' }),
    data: Flags.string({ required: true, description: 'JSON content (inline, @file, or -)' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ParticipantsUpdate);
    const baseFlags = flags as unknown as BaseFlags;
    let body: unknown;
    try {
      body = await parseDataInput(flags.data);
    } catch (err) {
      this.fail(err);
    }
    const encCaseId = encodeURIComponent(args.caseId);
    const encRole = encodeURIComponent(flags.role);
    await this.runMutateWithEtag(
      baseFlags,
      'PATCH',
      `/cases/${encCaseId}`,
      `/cases/${encCaseId}/participants/${encRole}`,
      body,
    );
  }
}
