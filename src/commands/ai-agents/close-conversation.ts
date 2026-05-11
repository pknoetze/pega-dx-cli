import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class AiAgentsCloseConversation extends BaseCommand {
  static override description = 'Close an AI agent conversation';
  static override examples = ['<%= config.bin %> ai-agents close-conversation MYAGENT --conversation PXCONV-1'];
  static override args = {
    agentId: Args.string({ required: true, description: 'Agent rule ID' }),
  };
  static override flags = {
    conversation: Flags.string({ required: true, description: 'Conversation ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AiAgentsCloseConversation);
    const baseFlags = flags as unknown as BaseFlags;
    const encAgent = encodeURIComponent(args.agentId);
    const encConv = encodeURIComponent(flags.conversation);
    await this.runPut(baseFlags, `/ai-agents/${encAgent}/conversations/${encConv}/close`, undefined);
  }
}
