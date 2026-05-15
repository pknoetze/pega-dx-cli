import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { parseDataInput } from '../../lib/input.js';

export const __endpoint = {
  path: '/data/{data_view_ID}/actions/{action_ID}',
  method: 'POST',
} as const;

export default class DataGetAction extends BaseCommand {
  static override description = 'Get a specific action for a data record';
  static override examples = [
    '<%= config.bin %> data get-action D_MyDataView --action myAction',
    "<%= config.bin %> data get-action D_MyDataView --action myAction --data '{\"field\":\"value\"}'",
  ];
  static override args = {
    dataViewId: Args.string({ required: true, description: 'Data view ID' }),
  };
  static override flags = {
    action: Flags.string({ required: true, description: 'Action ID' }),
    data: Flags.string({ description: 'JSON content (inline, @file, or -)' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(DataGetAction);
    const baseFlags = flags as unknown as BaseFlags;
    const encId = encodeURIComponent(args.dataViewId);
    const encAction = encodeURIComponent(flags.action);
    try {
      const body = flags.data ? await parseDataInput(flags.data, '--data') : {};
      await this.runPost(baseFlags, `/data/${encId}/actions/${encAction}`, body);
    } catch (err) {
      this.fail(err);
    }
  }
}
