import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class ParticipantsDelete extends BaseCommand {
  static override description = 'Remove a participant from a case';
  static override examples = [
    '<%= config.bin %> participants delete MYAPP-CASE-1 --role Owner --user U1',
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    role: Flags.string({ required: true, description: 'Participant role' }),
    user: Flags.string({ required: true, description: 'User ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ParticipantsDelete);
    // TODO: verify path semantics against real Pega in Task 13 — MCP uses /cases/{id}/participants/{participantID}
    const encCaseId = encodeURIComponent(args.caseId);
    const encRole = encodeURIComponent(flags.role);
    const encUser = encodeURIComponent(flags.user);
    await this.runDelete(
      flags as unknown as BaseFlags,
      `/cases/${encCaseId}/participants/${encRole}/${encUser}`,
    );
  }
}
