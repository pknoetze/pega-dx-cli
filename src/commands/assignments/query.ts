import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { type NormalizedError } from '../../lib/errors.js';

// Pega DX V2 exposes workbaskets via a data view (D_pyWorkBasketList or per-workbasket
// data views), not via a REST collection at /workbaskets/{id}/assignments. Phase 2b.2
// adds the data-view group; until then this command is reserved.
export default class AssignmentsQuery extends BaseCommand {
  static override description = 'Query a named assignment workbasket (NOT IMPLEMENTED in Phase 2b.1 — see Phase 2b.2 data views)';
  static override examples = [
    '<%= config.bin %> assignments query --workbasket WB-1',
    '<%= config.bin %> assignments query --workbasket WB-1 --max 50',
  ];
  static override flags = {
    workbasket: Flags.string({ required: true, description: 'Workbasket ID' }),
    max: Flags.integer({ description: 'Limit results' }),
  };

  async run(): Promise<void> {
    await this.parse(AssignmentsQuery);
    this.fail({
      code: 'NOT_IMPLEMENTED',
      message:
        'assignments query is deferred to Phase 2b.2. In Pega DX V2 workbaskets are surfaced via data views; once `pega data get-view <workbasketDataView>` lands in 2b.2 it provides the equivalent functionality.',
      httpStatus: 0,
    } satisfies NormalizedError);
  }
}
