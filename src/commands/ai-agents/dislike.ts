import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/ai-agents/{agentID}/conversations/{conversationID}/messages/{messageID}/dislike',
  method: 'PUT',
} as const;

export default class AiAgentsDislike extends BaseCommand {
  static override description = 'Dislike a message in an AI agent conversation';
  static override examples = [
    '<%= config.bin %> ai-agents dislike MYAGENT --conversation PXCONV-1 --message MSG-1 --feedback "off topic"',
  ];
  static override args = {
    agentId: Args.string({ required: true, description: 'Agent rule ID' }),
  };
  static override flags = {
    conversation: Flags.string({ required: true, description: 'Conversation ID' }),
    message: Flags.string({ required: true, description: 'Message ID to dislike' }),
    feedback: Flags.string({ required: true, description: 'Free-text feedback (becomes feedbackText in body)' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AiAgentsDislike);
    const baseFlags = flags as unknown as BaseFlags;
    const encAgent = encodeURIComponent(args.agentId);
    const encConv = encodeURIComponent(flags.conversation);
    const encMsg = encodeURIComponent(flags.message);
    await this.runPut(
      baseFlags,
      `/ai-agents/${encAgent}/conversations/${encConv}/messages/${encMsg}/dislike`,
      { feedbackText: flags.feedback },
    );
  }
}
