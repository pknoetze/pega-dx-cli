import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class DataDelete extends BaseCommand {
  static override description = 'Delete a data record';
  static override examples = ['<%= config.bin %> data delete D_MyDataView'];
  static override args = {
    dataViewId: Args.string({ required: true, description: 'Data view ID' }),
  };
  static override flags = {};

  async run(): Promise<void> {
    const { args, flags } = await this.parse(DataDelete);
    const baseFlags = flags as unknown as BaseFlags;
    const encId = encodeURIComponent(args.dataViewId);
    await this.runDelete(baseFlags, `/data/${encId}`);
  }
}
