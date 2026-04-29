import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class CaseTypesGetAction extends BaseCommand {
  static override description = 'Get the creation action/view for a case type';
  static override examples = [
    '<%= config.bin %> case-types get-action MYAPP-WORK-CASE --action pyStartCase',
  ];
  static override args = {
    caseTypeId: Args.string({ required: true, description: 'Case type ID' }),
  };
  static override flags = {
    action: Flags.string({ required: true, description: 'Action ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CaseTypesGetAction);
    const encId = encodeURIComponent(args.caseTypeId);
    const encAction = encodeURIComponent(flags.action);
    const path = `/casetypes/${encId}/actions/${encAction}`;
    await this.runGet(flags as unknown as BaseFlags, path);
  }
}
