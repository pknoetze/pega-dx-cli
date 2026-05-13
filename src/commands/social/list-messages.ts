import { Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class SocialListMessages extends BaseCommand {
  static override description = 'List Pulse messages for a context';
  static override examples = ['<%= config.bin %> social list-messages --filter-by Pulse --filter-for MYORG-WORK\\!M-1'];
  static override flags = {
    'filter-by': Flags.string({ required: true, description: '→ ?filterBy=' }),
    'filter-for': Flags.string({ required: true, description: '→ ?filterFor=' }),
    'page-size': Flags.string({ description: '→ ?pageSize=' }),
    'older-than': Flags.string({ description: '→ ?olderThan=' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SocialListMessages);
    const baseFlags = flags as unknown as BaseFlags;
    const params = new URLSearchParams({
      filterBy: flags['filter-by'],
      filterFor: flags['filter-for'],
    });
    if (flags['page-size'] !== undefined) params.set('pageSize', flags['page-size']);
    if (flags['older-than'] !== undefined) params.set('olderThan', flags['older-than']);
    await this.runGet(baseFlags, `/messages?${params.toString()}`);
  }
}
