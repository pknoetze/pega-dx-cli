import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class DocumentsList extends BaseCommand {
  static override description = 'List all documents associated with a case';
  static override examples = ['<%= config.bin %> documents list MYAPP-CASE-1'];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(DocumentsList);
    // TODO: verify path against real Pega in Task 13 — MCP does not implement get_case_documents
    const path = `/cases/${encodeURIComponent(args.caseId)}/documents`;
    await this.runGet(flags as unknown as BaseFlags, path);
  }
}
