import { Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class SocialListMentions extends BaseCommand {
  static override description = 'List mentions for a search string and type';
  static override examples = ['<%= config.bin %> social list-mentions --mentions-type Operators --search-for jdoe'];
  static override flags = {
    'mentions-type': Flags.string({ required: true, description: '→ ?mentionsType=' }),
    context: Flags.string({ description: 'Pulse gadget context (→ ?context=)' }),
    'search-for': Flags.string({ description: '→ ?searchFor=' }),
    'list-size': Flags.string({ description: '→ ?listSize=' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SocialListMentions);
    const baseFlags = flags as unknown as BaseFlags;
    const params = new URLSearchParams({ mentionsType: flags['mentions-type'] });
    if (flags.context !== undefined) params.set('context', flags.context);
    if (flags['search-for'] !== undefined) params.set('searchFor', flags['search-for']);
    if (flags['list-size'] !== undefined) params.set('listSize', flags['list-size']);
    await this.runGet(baseFlags, `/mentions?${params.toString()}`);
  }
}
