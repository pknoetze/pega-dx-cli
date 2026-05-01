import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { type NormalizedError } from '../../lib/errors.js';

// Pega DX V2 has no /cases/{id}/pages/{page} endpoint. Embedded pages are returned as
// part of the case detail response (`pega cases get`) under data.caseInfo.content. Once
// data views land in Phase 2b.2 (`pega data update`/`pega data save-partial`) those will
// cover the read/write story for embedded pages.
export default class CasesGetPage extends BaseCommand {
  static override description = 'Get a named embedded page from a case (NOT IMPLEMENTED in Phase 2b.1 — embedded pages are part of `cases get`; see Phase 2b.2 data views)';
  static override examples = ['<%= config.bin %> cases get-page MYAPP-CASE-1 --page Customer'];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    page: Flags.string({ required: true, description: 'Page name' }),
  };

  async run(): Promise<void> {
    await this.parse(CasesGetPage);
    this.fail({
      code: 'NOT_IMPLEMENTED',
      message:
        'cases get-page is deferred to Phase 2b.2. Embedded pages are returned by `pega cases get` under data.caseInfo.content; for direct read/write of embedded pages use the data view commands landing in 2b.2.',
      httpStatus: 0,
    } satisfies NormalizedError);
  }
}
