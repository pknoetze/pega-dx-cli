import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class DataListActions extends BaseCommand {
  static override description = 'List available actions for a data record';
  static override examples = ['<%= config.bin %> data list-actions D_MyDataView'];
  static override args = {
    dataViewId: Args.string({ required: true, description: 'Data view ID' }),
  };
  static override flags = {};

  async run(): Promise<void> {
    const { args, flags } = await this.parse(DataListActions);
    const baseFlags = flags as unknown as BaseFlags;
    const encId = encodeURIComponent(args.dataViewId);
    await this.runPost(baseFlags, `/data/${encId}/actions`, {});
  }
}
