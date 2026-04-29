import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class FollowersDelete extends BaseCommand {
  static override description = 'Remove a follower from a case';
  static override examples = ['<%= config.bin %> followers delete MYAPP-CASE-1 --user U1'];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    user: Flags.string({ required: true, description: 'User ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(FollowersDelete);
    const encCaseId = encodeURIComponent(args.caseId);
    const encUser = encodeURIComponent(flags.user);
    await this.runDelete(
      flags as unknown as BaseFlags,
      `/cases/${encCaseId}/followers/${encUser}`,
    );
  }
}
