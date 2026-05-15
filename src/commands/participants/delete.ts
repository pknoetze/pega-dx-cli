import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/cases/{caseID}/participants/{participantID}',
  method: 'DELETE',
} as const;

export default class ParticipantsDelete extends BaseCommand {
  static override description = 'Remove a participant from a case';
  static override examples = [
    '<%= config.bin %> participants delete MYAPP-CASE-1 --participant-id PEGA-PART-X',
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    'participant-id': Flags.string({
      required: true,
      description: 'Participant instance ID',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ParticipantsDelete);
    const encCaseId = encodeURIComponent(args.caseId);
    const encPartId = encodeURIComponent(flags['participant-id']);
    await this.runDelete(
      flags as unknown as BaseFlags,
      `/cases/${encCaseId}/participants/${encPartId}`,
    );
  }
}
