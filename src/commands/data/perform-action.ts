import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { composeMutationBody, type MutationBodyFlags } from '../../lib/input.js';

export default class DataPerformAction extends BaseCommand {
  static override description = 'Perform an action on a data record';
  static override examples = [
    '<%= config.bin %> data perform-action D_MyDataView --action myAction',
    "<%= config.bin %> data perform-action D_MyDataView --action myAction --data '{\"field\":\"value\"}'",
    '<%= config.bin %> data perform-action D_MyDataView --action myAction --data @form.json --page-instructions @pi.json',
  ];
  static override args = {
    dataViewId: Args.string({ required: true, description: 'Data view ID' }),
  };
  static override flags = {
    action: Flags.string({ required: true, description: 'Action ID' }),
    data: Flags.string({ description: 'JSON content (inline, @file, or -)' }),
    'page-instructions': Flags.string({
      description: 'JSON page-instructions array (inline, @file, or -)',
    }),
    attachments: Flags.string({
      description: 'JSON attachments array (inline, @file, or -)',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(DataPerformAction);
    const baseFlags = flags as unknown as BaseFlags;
    const encId = encodeURIComponent(args.dataViewId);
    const encAction = encodeURIComponent(flags.action);
    let body: Record<string, unknown> = {};
    try {
      body = await composeMutationBody(flags as MutationBodyFlags, 'action');
    } catch (err) {
      this.fail(err);
    }
    await this.runMutateWithEtag(
      baseFlags,
      'PATCH',
      `/data_views/${encId}`,
      `/data/${encId}/actions/${encAction}`,
      body,
    );
  }
}
