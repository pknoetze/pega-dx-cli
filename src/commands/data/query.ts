import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { composeDataQueryBody, type DataQueryBodyFlags } from '../../lib/input.js';
import { EXTENDED_TIMEOUT_MS } from '../../lib/api-client.js';

export const __endpoint = {
  path: '/data_views/{data_view_ID}',
  method: 'POST',
} as const;

export default class DataQuery extends BaseCommand {
  static override description = 'Query a data view by POSTing to /data_views/{dataViewId}';
  static override examples = [
    '<%= config.bin %> data query D_MyDataView --max 10 --include-total',
    '<%= config.bin %> data query D_MyDataView --params \'{"employeeID":"E1"}\'',
    '<%= config.bin %> data query D_MyDataView --data \'{"query":{"select":["X"]}}\'',
  ];

  static override args = {
    dataViewId: Args.string({ required: true, description: 'Data view ID' }),
  };

  static override flags = {
    params: Flags.string({ description: 'JSON object of data view parameters → dataViewParameters' }),
    max: Flags.integer({ description: 'Maximum results to fetch → paging.maxResultsToFetch' }),
    page: Flags.integer({ description: 'Page number → paging.pageNumber' }),
    'include-total': Flags.boolean({ description: 'Include total count in response → paging.includeTotalCount' }),
    data: Flags.string({
      char: 'd',
      description: 'Full request body as JSON (mutually exclusive with --params/--max/--page/--include-total)',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(DataQuery);
    const baseFlags = flags as unknown as BaseFlags;
    const encId = encodeURIComponent(args.dataViewId);
    try {
      const body = await composeDataQueryBody(flags as DataQueryBodyFlags, 'query');
      await this.runPost(baseFlags, `/data_views/${encId}`, body, { timeoutMs: EXTENDED_TIMEOUT_MS });
    } catch (err) {
      this.fail(err);
    }
  }
}
