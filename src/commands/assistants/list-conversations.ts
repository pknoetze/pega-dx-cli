import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/assistants/{assistantID}/conversations',
  method: 'GET',
} as const;

export default class AssistantsListConversations extends BaseCommand {
  static override description = 'List conversations for a GenAI assistant';
  static override examples = [
    '<%= config.bin %> assistants list-conversations MYASSISTANT --context-id MYORG-WORK\\!M-123',
    '<%= config.bin %> assistants list-conversations MYASSISTANT --context-id CTX --page-size 20 --page-index 0',
  ];
  static override args = {
    assistantId: Args.string({ required: true, description: 'Assistant rule ID (pxInsName)' }),
  };
  static override flags = {
    'context-id': Flags.string({ required: true, description: 'Context ID (case or landing-page context)' }),
    'page-size': Flags.integer({ description: 'Results per page' }),
    'page-index': Flags.integer({ description: 'Page index (0-based)' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AssistantsListConversations);
    const baseFlags = flags as unknown as BaseFlags;
    const encAssistant = encodeURIComponent(args.assistantId);
    const params = new URLSearchParams({ contextID: flags['context-id'] });
    if (flags['page-size'] !== undefined) params.set('pageSize', String(flags['page-size']));
    if (flags['page-index'] !== undefined) params.set('pageIndex', String(flags['page-index']));
    await this.runGet(baseFlags, `/assistants/${encAssistant}/conversations?${params.toString()}`);
  }
}
