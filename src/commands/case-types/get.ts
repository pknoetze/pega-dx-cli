import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class CaseTypesGet extends BaseCommand {
  static override description = 'Get full details of a specific case type';
  static override examples = ['<%= config.bin %> case-types get MYAPP-WORK-CASE'];
  static override args = {
    caseTypeId: Args.string({ required: true, description: 'Case type ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CaseTypesGet);
    // TODO: verify path against real Pega in Task 13 — MCP does not implement get_case_type
    const path = `/casetypes/${encodeURIComponent(args.caseTypeId)}`;
    await this.runGet(flags as unknown as BaseFlags, path);
  }
}
