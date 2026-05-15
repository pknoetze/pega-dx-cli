import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { parseDataInput } from '../../lib/input.js';

export const __endpoint = {
  path: '/cases/{caseID}/actions/{actionID}/recalculate',
  method: 'PATCH',
} as const;

export default class CasesRecalculate extends BaseCommand {
  static override description = 'Recalculate calculated fields and when conditions for a case action';
  static override examples = [
    '<%= config.bin %> cases recalculate MYAPP-CASE-1 --action Approve --data \'{"calculations":{"fields":[{"name":".Total","context":"content"}]}}\'',
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    action: Flags.string({ required: true, description: 'Case action ID' }),
    data: Flags.string({
      required: true,
      description:
        'JSON: {calculations:{fields:[{name:".X",context:"content"}]}} (inline, @file, or -)',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CasesRecalculate);
    const baseFlags = flags as unknown as BaseFlags;
    let body: unknown = undefined;
    try {
      body = await parseDataInput(flags.data);
    } catch (err) {
      this.fail(err);
    }
    const encId = encodeURIComponent(args.caseId);
    const encAction = encodeURIComponent(flags.action);
    await this.runMutateWithEtag(
      baseFlags,
      'PATCH',
      `/cases/${encId}`,
      `/cases/${encId}/actions/${encAction}/recalculate`,
      body,
    );
  }
}
