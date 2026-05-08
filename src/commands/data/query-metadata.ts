import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { composeDataQueryBody, type DataQueryBodyFlags } from '../../lib/input.js';
import { EXTENDED_TIMEOUT_MS } from '../../lib/api-client.js';

export default class DataQueryMetadata extends BaseCommand {
  static override description = 'Get metadata for a data view by POSTing to /data_views/{dataViewId}/metadata';
  static override examples = [
    '<%= config.bin %> data query-metadata D_MyDataView',
    '<%= config.bin %> data query-metadata D_MyDataView --params \'{"employeeID":"E1"}\'',
    '<%= config.bin %> data query-metadata D_MyDataView --data \'{"dataViewParameters":{"employeeID":"E1"}}\'',
  ];

  static override args = {
    dataViewId: Args.string({ required: true, description: 'Data view ID' }),
  };

  static override flags = {
    params: Flags.string({ description: 'JSON object of data view parameters → dataViewParameters' }),
    data: Flags.string({
      char: 'd',
      description: 'Full request body as JSON (mutually exclusive with --params)',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(DataQueryMetadata);
    const baseFlags = flags as unknown as BaseFlags;
    const encId = encodeURIComponent(args.dataViewId);
    try {
      const body = await composeDataQueryBody(flags as DataQueryBodyFlags, 'count-or-metadata');
      await this.runPost(baseFlags, `/data_views/${encId}/metadata`, body, { timeoutMs: EXTENDED_TIMEOUT_MS });
    } catch (err) {
      this.fail(err);
    }
  }
}
