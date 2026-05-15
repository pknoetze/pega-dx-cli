import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/ai-agents/{agentID}/conversations/{conversationID}',
  method: 'GET',
} as const;

export default class AiAgentsGetConversation extends BaseCommand {
  static override description = 'Get details of a single AI agent conversation';
  static override examples = ['<%= config.bin %> ai-agents get-conversation MYAGENT --conversation PXCONV-503025'];
  static override args = {
    agentId: Args.string({ required: true, description: 'Agent rule ID (pxInsName)' }),
  };
  static override flags = {
    conversation: Flags.string({ required: true, description: 'Conversation ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AiAgentsGetConversation);
    const baseFlags = flags as unknown as BaseFlags;
    const encAgent = encodeURIComponent(args.agentId);
    const encConv = encodeURIComponent(flags.conversation);
    await this.runGet(baseFlags, `/ai-agents/${encAgent}/conversations/${encConv}`);
  }
}
