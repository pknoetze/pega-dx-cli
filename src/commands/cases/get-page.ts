import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class CasesGetPage extends BaseCommand {
  static override description = 'Get a named page for a case';
  static override examples = ['<%= config.bin %> cases get-page MYAPP-CASE-1 --page Customer'];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    page: Flags.string({ required: true, description: 'Page name' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CasesGetPage);
    // TODO: verify path against real Pega in Task 13 — MCP does not implement get_case_page
    const encId = encodeURIComponent(args.caseId);
    const encPage = encodeURIComponent(flags.page);
    await this.runGet(flags as unknown as BaseFlags, `/cases/${encId}/pages/${encPage}`);
  }
}
