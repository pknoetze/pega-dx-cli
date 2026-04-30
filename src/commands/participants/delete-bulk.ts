import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class ParticipantsDeleteBulk extends BaseCommand {
  static override description = 'Remove all participants in a given role';
  static override examples = [
    '<%= config.bin %> participants delete-bulk MYAPP-CASE-1 --role Reviewer',
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    role: Flags.string({ required: true, description: 'Participant role' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ParticipantsDeleteBulk);
    // TODO: verify path against real Pega in Task 13 — MCP does not implement delete_case_participants
    // TODO: verify whether ?role= accepts a role name or a participantID in Task 13 (same ambiguity as participants get/delete)
    const encCaseId = encodeURIComponent(args.caseId);
    const params = new URLSearchParams({ role: flags.role });
    const path = `/cases/${encCaseId}/participants?${params.toString()}`;
    await this.runDelete(flags as unknown as BaseFlags, path);
  }
}
