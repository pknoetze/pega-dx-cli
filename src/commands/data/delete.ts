import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/data/{data_view_ID}',
  method: 'DELETE',
} as const;

export default class DataDelete extends BaseCommand {
  static override description = 'Delete a data record';
  static override examples = [
    "<%= config.bin %> data delete D_MyDataView --params '{\"id\":101}'",
  ];
  static override args = {
    dataViewId: Args.string({ required: true, description: 'Data view ID' }),
  };
  static override flags = {
    params: Flags.string({ description: 'JSON object of query parameters identifying the record to delete' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(DataDelete);
    const baseFlags = flags as unknown as BaseFlags;
    const encId = encodeURIComponent(args.dataViewId);
    let path = `/data/${encId}`;
    if (flags.params) {
      try {
        const parsed = JSON.parse(flags.params) as Record<string, unknown>;
        const qs = new URLSearchParams(
          Object.entries(parsed).map(([k, v]) => [k, String(v)]),
        ).toString();
        if (qs) path += `?${qs}`;
      } catch {
        this.fail({ code: 'INVALID_ARGS', message: '--params must be a valid JSON object', httpStatus: 0 });
      }
    }
    await this.runDelete(baseFlags, path);
  }
}
