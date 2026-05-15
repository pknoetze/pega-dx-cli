import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/cases/{caseID}/followers',
  method: 'GET',
} as const;

export default class FollowersList extends BaseCommand {
  static override description = 'List all followers of a case';
  static override examples = ['<%= config.bin %> followers list MYAPP-CASE-1'];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(FollowersList);
    const path = `/cases/${encodeURIComponent(args.caseId)}/followers`;
    await this.runGet(flags as unknown as BaseFlags, path);
  }
}
