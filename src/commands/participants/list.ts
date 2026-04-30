import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class ParticipantsList extends BaseCommand {
  static override description = 'List all participants on a case';
  static override examples = ['<%= config.bin %> participants list MYAPP-CASE-1'];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ParticipantsList);
    const path = `/cases/${encodeURIComponent(args.caseId)}/participants`;
    await this.runGet(flags as unknown as BaseFlags, path);
  }
}
