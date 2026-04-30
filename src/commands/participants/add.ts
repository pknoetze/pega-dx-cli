import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class ParticipantsAdd extends BaseCommand {
  static override description = 'Add a participant to a case in a given role';
  static override examples = [
    '<%= config.bin %> participants add MYAPP-CASE-1 --role Owner --user U1',
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    role: Flags.string({ required: true, description: 'Participant role' }),
    user: Flags.string({ required: true, description: 'User ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ParticipantsAdd);
    const path = `/cases/${encodeURIComponent(args.caseId)}/participants`;
    await this.runPost(flags as unknown as BaseFlags, path, {
      role: flags.role,
      user: flags.user,
    });
  }
}
