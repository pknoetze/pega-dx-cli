import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/feeds/{feedID}',
  method: 'GET',
} as const;

export default class SocialGetFeed extends BaseCommand {
  static override description = 'Get a Pulse feed list';
  static override examples = ['<%= config.bin %> social get-feed MyFeed --filter-for MYORG-WORK\\!M-1'];
  static override args = {
    feedID: Args.string({ required: true, description: 'Feed ID' }),
  };
  static override flags = {
    'filter-for': Flags.string({ required: true, description: 'contextID or userID (→ ?filterFor=)' }),
    'older-than': Flags.string({ description: 'Only entries older than this datetime (→ ?olderThan=)' }),
    'page-size': Flags.string({ description: 'Max entries (→ ?pageSize=)' }),
    'feed-class': Flags.string({ description: 'Pulse feed rule class (→ ?feedClass=)' }),
    'filter-by': Flags.string({ description: 'Feed source list, comma-separated (→ ?filterBy=)' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(SocialGetFeed);
    const baseFlags = flags as unknown as BaseFlags;
    const params = new URLSearchParams({ filterFor: flags['filter-for'] });
    if (flags['older-than'] !== undefined) params.set('olderThan', flags['older-than']);
    if (flags['page-size'] !== undefined) params.set('pageSize', flags['page-size']);
    if (flags['feed-class'] !== undefined) params.set('feedClass', flags['feed-class']);
    if (flags['filter-by'] !== undefined) params.set('filterBy', flags['filter-by']);
    await this.runGet(baseFlags, `/feeds/${encodeURIComponent(args.feedID)}?${params.toString()}`);
  }
}
