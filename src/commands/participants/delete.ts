import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class ParticipantsDelete extends BaseCommand {
  static override description = 'Remove a participant from a case (identified by role)';
  static override examples = [
    '<%= config.bin %> participants delete MYAPP-CASE-1 --role Customer',
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    role: Flags.string({ required: true, description: 'Participant role (also acts as the participant identifier)' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ParticipantsDelete);
    const encCaseId = encodeURIComponent(args.caseId);
    const encRole = encodeURIComponent(flags.role);
    await this.runDelete(
      flags as unknown as BaseFlags,
      `/cases/${encCaseId}/participants/${encRole}`,
    );
  }
}
