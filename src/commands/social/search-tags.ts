import { Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class SocialSearchTags extends BaseCommand {
  static override description = 'Search tags by string';
  static override examples = ['<%= config.bin %> social search-tags --search-for security --list-size 20'];
  static override flags = {
    'search-for': Flags.string({ description: '→ ?searchFor=' }),
    'list-size': Flags.string({ description: '→ ?listSize=' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SocialSearchTags);
    const baseFlags = flags as unknown as BaseFlags;
    const params = new URLSearchParams();
    if (flags['search-for'] !== undefined) params.set('searchFor', flags['search-for']);
    if (flags['list-size'] !== undefined) params.set('listSize', flags['list-size']);
    const qs = params.toString();
    await this.runGet(baseFlags, qs ? `/tags?${qs}` : '/tags');
  }
}
