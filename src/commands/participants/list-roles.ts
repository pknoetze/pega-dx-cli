import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class ParticipantsListRoles extends BaseCommand {
  static override description = 'List participant roles configured on a case';
  static override examples = ['<%= config.bin %> participants list-roles MYAPP-CASE-1'];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ParticipantsListRoles);
    const enc = encodeURIComponent(args.caseId);
    await this.runGet(
      flags as unknown as BaseFlags,
      `/cases/${enc}/participant_roles`,
    );
  }
}
