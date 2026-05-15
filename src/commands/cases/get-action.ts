import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/cases/{caseID}/actions/{actionID}',
  method: 'GET',
} as const;

export default class CasesGetAction extends BaseCommand {
  static override description = 'Get the view/form for a specific action on a case';
  static override examples = ['<%= config.bin %> cases get-action MYAPP-CASE-1 --action Approve'];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    action: Flags.string({ required: true, description: 'Case action ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CasesGetAction);
    const encId = encodeURIComponent(args.caseId);
    const encAction = encodeURIComponent(flags.action);
    await this.runGet(flags as unknown as BaseFlags, `/cases/${encId}/actions/${encAction}`);
  }
}
