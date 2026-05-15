import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/portals/{portalID}',
  method: 'GET',
} as const;

export default class PagesPortal extends BaseCommand {
  static override description = 'Get portal details by portal ID';
  static override examples = ['<%= config.bin %> pages portal MyPortal'];
  static override args = {
    portalID: Args.string({ required: true, description: 'Portal ID' }),
  };
  static override flags = {};

  async run(): Promise<void> {
    const { args, flags } = await this.parse(PagesPortal);
    await this.runGet(
      flags as unknown as BaseFlags,
      `/portals/${encodeURIComponent(args.portalID)}`,
    );
  }
}
