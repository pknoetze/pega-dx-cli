import { Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class AssignmentsList extends BaseCommand {
  static override description = "List all assignments in the operator's worklist";
  static override examples = [
    '<%= config.bin %> assignments list',
    '<%= config.bin %> assignments list --max 50',
  ];
  static override flags = {
    max: Flags.integer({ description: 'Limit results' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AssignmentsList);
    // TODO: verify path against real Pega in Task 13 — MCP does not implement get_worklist
    const params = new URLSearchParams({ type: 'worklist' });
    if (flags.max !== undefined) params.set('pageSize', String(flags.max));
    const path = `/assignments?${params.toString()}`;
    await this.runGet(flags as unknown as BaseFlags, path);
  }
}
