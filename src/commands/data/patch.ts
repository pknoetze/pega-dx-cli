import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { parseDataInput } from '../../lib/input.js';

export default class DataPatch extends BaseCommand {
  static override description = 'Patch a data record (PATCH with eTag)';
  static override examples = [
    '<%= config.bin %> data patch D_MyDataView --data \'{"field":"value"}\'',
  ];
  static override args = {
    dataViewId: Args.string({ required: true, description: 'Data view ID' }),
  };
  static override flags = {
    data: Flags.string({ required: true, description: 'JSON body (inline, @file, or -)' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(DataPatch);
    const baseFlags = flags as unknown as BaseFlags;
    const encId = encodeURIComponent(args.dataViewId);
    try {
      const body = await parseDataInput(flags.data, '--data');
      await this.runPatch(baseFlags, `/data/${encId}`, body);
    } catch (err) {
      this.fail(err);
    }
  }
}
