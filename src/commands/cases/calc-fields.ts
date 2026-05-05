import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { parseDataInput } from '../../lib/input.js';

export default class CasesCalcFields extends BaseCommand {
  static override description = 'Compute calculated fields for a case view';
  static override examples = [
    '<%= config.bin %> cases calc-fields MYAPP-CASE-1 --view Summary --data @fields.json',
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    view: Flags.string({ required: true, description: 'View name' }),
    data: Flags.string({
      required: true,
      description:
        'JSON: {calculations:{fields:[{name:".X",context:"content"}]}} (inline, @file, or -)',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CasesCalcFields);
    let body: unknown = undefined;
    try {
      body = await parseDataInput(flags.data);
    } catch (err) {
      this.fail(err);
    }
    const encId = encodeURIComponent(args.caseId);
    const encView = encodeURIComponent(flags.view);
    await this.runPost(
      flags as unknown as BaseFlags,
      `/cases/${encId}/views/${encView}/calculated_fields`,
      body,
    );
  }
}
