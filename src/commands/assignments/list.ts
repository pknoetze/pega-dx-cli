import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { type NormalizedError } from '../../lib/errors.js';

// Pega DX V2 exposes the operator worklist via a data view (D_pyMyWorkList), not via a
// REST collection at /assignments. Phase 2b.2 adds the data-view group (`pega data
// get-view`) which is the canonical way to fetch the worklist with filtering and
// pagination. This command is reserved as a future ergonomic shortcut.
export default class AssignmentsList extends BaseCommand {
  static override description = "List all assignments in the operator's worklist (NOT IMPLEMENTED in Phase 2b.1 — see Phase 2b.2 data views)";
  static override examples = [
    '<%= config.bin %> assignments list',
    '<%= config.bin %> assignments list --max 50',
  ];
  static override flags = {
    max: Flags.integer({ description: 'Limit results' }),
  };

  async run(): Promise<void> {
    await this.parse(AssignmentsList);
    this.fail({
      code: 'NOT_IMPLEMENTED',
      message:
        'assignments list is deferred to Phase 2b.2. In Pega DX V2 the worklist is a data view; once `pega data get-view D_pyMyWorkList` lands in 2b.2 it provides the equivalent functionality with filtering and pagination.',
      httpStatus: 0,
    } satisfies NormalizedError);
  }
}
