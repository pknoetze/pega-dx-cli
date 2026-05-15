import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/ai-agents/{agentID}/conversations',
  method: 'GET',
} as const;

export default class AiAgentsListConversations extends BaseCommand {
  static override description = 'List conversations for an AI agent';
  static override examples = [
    '<%= config.bin %> ai-agents list-conversations MYAGENT --context-id MYORG-MYAPP-WORK\\!M-123',
    '<%= config.bin %> ai-agents list-conversations MYAGENT --context-id CTX --page-size 20 --page-index 0',
  ];
  static override args = {
    agentId: Args.string({ required: true, description: 'Agent rule ID (pxInsName)' }),
  };
  static override flags = {
    'context-id': Flags.string({ required: true, description: 'Context ID (case context or landing-page context)' }),
    'page-size': Flags.integer({ description: 'Results per page' }),
    'page-index': Flags.integer({ description: 'Page index (0-based)' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AiAgentsListConversations);
    const baseFlags = flags as unknown as BaseFlags;
    const encAgent = encodeURIComponent(args.agentId);
    const params = new URLSearchParams({ contextID: flags['context-id'] });
    if (flags['page-size'] !== undefined) params.set('pageSize', String(flags['page-size']));
    if (flags['page-index'] !== undefined) params.set('pageIndex', String(flags['page-index']));
    await this.runGet(baseFlags, `/ai-agents/${encAgent}/conversations?${params.toString()}`);
  }
}
