import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/cases/{caseID}/related_cases/{related_caseID}',
  method: 'DELETE',
} as const;

export default class RelatedDelete extends BaseCommand {
  static override description = 'Remove a related case link';
  static override examples = [
    '<%= config.bin %> related delete MYAPP-CASE-1 --related-case-id MYAPP-CASE-2',
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    'related-case-id': Flags.string({ required: true, description: 'Related case ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(RelatedDelete);
    const encCaseId = encodeURIComponent(args.caseId);
    const encRelated = encodeURIComponent(flags['related-case-id']);
    await this.runDelete(
      flags as unknown as BaseFlags,
      `/cases/${encCaseId}/related_cases/${encRelated}`,
    );
  }
}
