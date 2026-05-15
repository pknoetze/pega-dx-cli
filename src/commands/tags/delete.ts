import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/cases/{caseID}/tags/{tagID}',
  method: 'DELETE',
} as const;

export default class TagsDelete extends BaseCommand {
  static override description = 'Remove a tag from a case';
  static override examples = ['<%= config.bin %> tags delete MYAPP-CASE-1 --tag urgent'];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    tag: Flags.string({ required: true, description: 'Tag name' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(TagsDelete);
    const encCaseId = encodeURIComponent(args.caseId);
    const encTag = encodeURIComponent(flags.tag);
    await this.runDelete(flags as unknown as BaseFlags, `/cases/${encCaseId}/tags/${encTag}`);
  }
}
