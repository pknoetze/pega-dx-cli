import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/cases/{caseID}/participant_roles/{participant_role_ID}',
  method: 'GET',
} as const;

export default class ParticipantsGetRole extends BaseCommand {
  static override description = 'Get details of a specific participant role on a case';
  static override examples = [
    '<%= config.bin %> participants get-role MYAPP-CASE-1 --role-id Owner',
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    'role-id': Flags.string({ required: true, description: 'Participant role ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ParticipantsGetRole);
    const encCaseId = encodeURIComponent(args.caseId);
    const encRole = encodeURIComponent(flags['role-id']);
    await this.runGet(
      flags as unknown as BaseFlags,
      `/cases/${encCaseId}/participant_roles/${encRole}`,
    );
  }
}
