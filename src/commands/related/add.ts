import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class RelatedAdd extends BaseCommand {
  static override description = 'Add a related case link';
  static override examples = [
    '<%= config.bin %> related add MYAPP-CASE-1 --related-case-id MYAPP-CASE-2 --relationship parent',
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    'related-case-id': Flags.string({ required: true, description: 'Related case ID' }),
    relationship: Flags.string({ required: true, description: 'Relationship type' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(RelatedAdd);
    const path = `/cases/${encodeURIComponent(args.caseId)}/related_cases`;
    await this.runPost(flags as unknown as BaseFlags, path, {
      relatedCaseID: flags['related-case-id'],
      relationship: flags.relationship,
    });
  }
}
