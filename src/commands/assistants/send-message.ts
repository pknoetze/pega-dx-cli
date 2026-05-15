import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/assistants/{assistantID}/conversations/{conversationID}',
  method: 'PATCH',
} as const;

export default class AssistantsSendMessage extends BaseCommand {
  static override description = 'Send a message in a GenAI assistant conversation';
  static override examples = [
    '<%= config.bin %> assistants send-message MYASSISTANT --conversation PXCONV-1 --request "hello"',
  ];
  static override args = {
    assistantId: Args.string({ required: true, description: 'Assistant rule ID' }),
  };
  static override flags = {
    conversation: Flags.string({ required: true, description: 'Conversation ID' }),
    request: Flags.string({ required: true, description: 'User query text' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AssistantsSendMessage);
    const baseFlags = flags as unknown as BaseFlags;
    const encAssistant = encodeURIComponent(args.assistantId);
    const encConv = encodeURIComponent(flags.conversation);
    await this.runPatch(baseFlags, `/assistants/${encAssistant}/conversations/${encConv}`, {
      Request: flags.request,
    });
  }
}
