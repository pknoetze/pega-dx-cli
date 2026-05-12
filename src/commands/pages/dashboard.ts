import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class PagesDashboard extends BaseCommand {
  static override description = 'Get page details for displaying a Dashboard';
  static override examples = ['<%= config.bin %> pages dashboard MyDashboard'];
  static override args = {
    dashboardID: Args.string({ required: true, description: 'Dashboard ID' }),
  };
  static override flags = {};

  async run(): Promise<void> {
    const { args, flags } = await this.parse(PagesDashboard);
    await this.runGet(
      flags as unknown as BaseFlags,
      `/dashboard/${encodeURIComponent(args.dashboardID)}`,
    );
  }
}
