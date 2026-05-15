import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/cases/{caseID}/tags',
  method: 'POST',
} as const;

export default class TagsAdd extends BaseCommand {
  static override description = 'Add one or more tags to a case';
  static override examples = [
    '<%= config.bin %> tags add MYAPP-CASE-1 --tag urgent',
    '<%= config.bin %> tags add MYAPP-CASE-1 --tag urgent --tag review',
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    tag: Flags.string({
      required: true,
      multiple: true,
      description: 'Tag name (repeat for multiple)',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(TagsAdd);
    const path = `/cases/${encodeURIComponent(args.caseId)}/tags`;
    await this.runPost(flags as unknown as BaseFlags, path, { tags: flags.tag });
  }
}
