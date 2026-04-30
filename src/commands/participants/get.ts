import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class ParticipantsGet extends BaseCommand {
  static override description = 'Get a specific participant by role';
  static override examples = [
    '<%= config.bin %> participants get MYAPP-CASE-1 --role Owner',
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    role: Flags.string({ required: true, description: 'Participant role' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ParticipantsGet);
    // TODO: verify <role> vs <participantID> path semantics in Task 13 — MCP uses {participantID}
    const encCaseId = encodeURIComponent(args.caseId);
    const encRole = encodeURIComponent(flags.role);
    await this.runGet(
      flags as unknown as BaseFlags,
      `/cases/${encCaseId}/participants/${encRole}`,
    );
  }
}
