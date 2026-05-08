import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class DataGetMetadata extends BaseCommand {
  static override description = 'Get metadata for a data view by ID';
  static override examples = ['<%= config.bin %> data get-metadata D_MyDataView'];
  static override args = {
    dataViewId: Args.string({ required: true, description: 'Data view ID' }),
  };
  static override flags = {};

  async run(): Promise<void> {
    const { args, flags } = await this.parse(DataGetMetadata);
    await this.runGet(
      flags as unknown as BaseFlags,
      `/data_views/${encodeURIComponent(args.dataViewId)}/metadata`,
    );
  }
}
