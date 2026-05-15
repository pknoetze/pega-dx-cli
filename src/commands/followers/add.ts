import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/cases/{caseID}/followers',
  method: 'POST',
} as const;

export default class FollowersAdd extends BaseCommand {
  static override description = 'Add a follower to a case';
  static override examples = ['<%= config.bin %> followers add MYAPP-CASE-1 --user U1'];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    user: Flags.string({ required: true, description: 'User ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(FollowersAdd);
    const path = `/cases/${encodeURIComponent(args.caseId)}/followers`;
    await this.runPost(flags as unknown as BaseFlags, path, { user: flags.user });
  }
}
