import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { parseDataInput } from '../../lib/input.js';

export const __endpoint = {
  path: '/data/{data_view_ID}',
  method: 'POST',
} as const;

export default class DataCreate extends BaseCommand {
  static override description = 'Create a new data record';
  static override examples = [
    '<%= config.bin %> data create D_MyDataView --data \'{"field":"value"}\'',
  ];
  static override args = {
    dataViewId: Args.string({ required: true, description: 'Data view ID' }),
  };
  static override flags = {
    data: Flags.string({ required: true, description: 'JSON body (inline, @file, or -)' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(DataCreate);
    const baseFlags = flags as unknown as BaseFlags;
    const encId = encodeURIComponent(args.dataViewId);
    try {
      const body = await parseDataInput(flags.data, '--data');
      await this.runPost(baseFlags, `/data/${encId}`, { data: body });
    } catch (err) {
      this.fail(err);
    }
  }
}
