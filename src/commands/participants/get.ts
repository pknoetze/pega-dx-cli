import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/cases/{caseID}/participants/{participantID}',
  method: 'GET',
} as const;

export default class ParticipantsGet extends BaseCommand {
  static override description = 'Get a specific participant by participant ID';
  static override examples = [
    '<%= config.bin %> participants get MYAPP-CASE-1 --participant-id PEGA-PART-X',
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
    const { args, flags } = await this.parse(ParticipantsGet);
    const encCaseId = encodeURIComponent(args.caseId);
    const encPartId = encodeURIComponent(flags['participant-id']);
    await this.runGet(
      flags as unknown as BaseFlags,
      `/cases/${encCaseId}/participants/${encPartId}`,
    );
  }
}
