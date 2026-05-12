import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class PagesGet extends BaseCommand {
  static override description = 'Get page details by page ID';
  static override examples = [
    '<%= config.bin %> pages get MyPage',
    '<%= config.bin %> pages get MyPage --page-class CW-Work',
  ];
  static override args = {
    pageID: Args.string({ required: true, description: 'Page ID' }),
  };
  static override flags = {
    'page-class': Flags.string({ description: 'Class in which the page lives (→ ?pageClass=)' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(PagesGet);
    const baseFlags = flags as unknown as BaseFlags;
    const encPage = encodeURIComponent(args.pageID);
    let path = `/pages/${encPage}`;
    if (flags['page-class'] !== undefined) {
      const params = new URLSearchParams({ pageClass: flags['page-class'] });
      path = `${path}?${params.toString()}`;
    }
    await this.runGet(baseFlags, path);
  }
}
