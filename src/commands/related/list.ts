import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class RelatedList extends BaseCommand {
  static override description = 'List all related cases';
  static override examples = ['<%= config.bin %> related list MYAPP-CASE-1'];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(RelatedList);
    const path = `/cases/${encodeURIComponent(args.caseId)}/related_cases`;
    await this.runGet(flags as unknown as BaseFlags, path);
  }
}
