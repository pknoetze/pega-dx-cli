import { Args } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { type NormalizedError } from '../../lib/errors.js';

// Pega DX V2 has no /cases/{id}/documents endpoint. In real Pega instances, documents
// are surfaced as case attachments (with a category like "Document"). Implementation
// will land in Phase 2b.2 alongside the `attachments` group, where it can be expressed
// as `pega attachments list <caseId>` filtered by category.
export default class DocumentsList extends BaseCommand {
  static override description = 'List all documents on a case (NOT IMPLEMENTED in Phase 2b.1 — see Phase 2b.2 attachments group)';
  static override examples = ['<%= config.bin %> documents list MYAPP-CASE-1'];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };

  async run(): Promise<void> {
    await this.parse(DocumentsList);
    this.fail({
      code: 'NOT_IMPLEMENTED',
      message:
        'documents list is deferred to Phase 2b.2. In Pega DX V2 documents are stored as case attachments; use the attachments group (lands in 2b.2) and filter by category.',
      httpStatus: 0,
    } satisfies NormalizedError);
  }
}
