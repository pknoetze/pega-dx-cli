import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import type { NormalizedError } from '../../lib/errors.js';

export const __endpoint = {
  path: '/pages/{pageID}',
  method: 'POST',
} as const;

export default class PagesGetWithContext extends BaseCommand {
  static override description = 'Get page details with a data context (POST /pages/{pageID})';
  static override examples = [
    '<%= config.bin %> pages get-with-context MyPage --data-context "ContextValue"',
  ];
  static override args = {
    pageID: Args.string({ required: true, description: 'Page ID' }),
  };
  static override flags = {
    'data-context': Flags.string({
      required: true,
      description: 'Data context string → request body { dataContext }',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(PagesGetWithContext);
    const baseFlags = flags as unknown as BaseFlags;
    if (flags['data-context'].length === 0) {
      throw {
        code: 'INVALID_ARGS',
        message: '--data-context must not be empty',
        httpStatus: 0,
      } satisfies NormalizedError;
    }
    const path = `/pages/${encodeURIComponent(args.pageID)}`;
    await this.runPost(baseFlags, path, { dataContext: flags['data-context'] });
  }
}
