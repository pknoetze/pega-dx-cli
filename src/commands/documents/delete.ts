import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/cases/{caseID}/documents/{documentID}',
  method: 'DELETE',
} as const;

export default class DocumentsDelete extends BaseCommand {
  static override description = 'Remove a document linked to a case';
  static override examples = [
    '<%= config.bin %> documents delete MYAPP-CASE-1 --document DOC-1',
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    document: Flags.string({ required: true, description: 'Document ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(DocumentsDelete);
    const encCaseId = encodeURIComponent(args.caseId);
    const encDoc = encodeURIComponent(flags.document);
    await this.runDelete(
      flags as unknown as BaseFlags,
      `/cases/${encCaseId}/documents/${encDoc}`,
    );
  }
}
