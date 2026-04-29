import { Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class AssignmentsQuery extends BaseCommand {
  static override description = 'Query a named assignment workbasket';
  static override examples = [
    '<%= config.bin %> assignments query --workbasket WB-1',
    '<%= config.bin %> assignments query --workbasket WB-1 --max 50',
  ];
  static override flags = {
    workbasket: Flags.string({ required: true, description: 'Workbasket ID' }),
    max: Flags.integer({ description: 'Limit results' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AssignmentsQuery);
    // TODO: verify path against real Pega in Task 13 — MCP does not implement get_workbasket
    const encWb = encodeURIComponent(flags.workbasket);
    const params = new URLSearchParams();
    if (flags.max !== undefined) params.set('pageSize', String(flags.max));
    const qs = params.toString();
    const path = `/workbaskets/${encWb}/assignments${qs ? `?${qs}` : ''}`;
    await this.runGet(flags as unknown as BaseFlags, path);
  }
}
