import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { parseDataInput } from '../../lib/input.js';

export default class DataUpdate extends BaseCommand {
  static override description = 'Update a data record (PUT with eTag)';
  static override examples = [
    '<%= config.bin %> data update D_MyDataView --data \'{"field":"value"}\'',
  ];
  static override args = {
    dataViewId: Args.string({ required: true, description: 'Data view ID' }),
  };
  static override flags = {
    data: Flags.string({ required: true, description: 'JSON body (inline, @file, or -)' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(DataUpdate);
    const baseFlags = flags as unknown as BaseFlags;
    const encId = encodeURIComponent(args.dataViewId);
    try {
      const body = await parseDataInput(flags.data, '--data');
      await this.runMutateWithEtag(
        baseFlags,
        'PUT',
        `/data_views/${encId}`,
        `/data/${encId}`,
        body,
      );
    } catch (err) {
      this.fail(err);
    }
  }
}
