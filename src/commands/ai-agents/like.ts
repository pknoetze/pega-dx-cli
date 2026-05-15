import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/ai-agents/{agentID}/conversations/{conversationID}/messages/{messageID}/like',
  method: 'PUT',
} as const;

export default class AiAgentsLike extends BaseCommand {
  static override description = 'Like a message in an AI agent conversation';
  static override examples = [
    '<%= config.bin %> ai-agents like MYAGENT --conversation PXCONV-1 --message MSG-1',
  ];
  static override args = {
    agentId: Args.string({ required: true, description: 'Agent rule ID' }),
  };
  static override flags = {
    conversation: Flags.string({ required: true, description: 'Conversation ID' }),
    message: Flags.string({ required: true, description: 'Message ID to like' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AiAgentsLike);
    const baseFlags = flags as unknown as BaseFlags;
    const encAgent = encodeURIComponent(args.agentId);
    const encConv = encodeURIComponent(flags.conversation);
    const encMsg = encodeURIComponent(flags.message);
    await this.runPut(
      baseFlags,
      `/ai-agents/${encAgent}/conversations/${encConv}/messages/${encMsg}/like`,
      undefined,
    );
  }
}
