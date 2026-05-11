import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class AssistantsGetConversation extends BaseCommand {
  static override description = 'Get details of a single GenAI assistant conversation';
  static override examples = ['<%= config.bin %> assistants get-conversation MYASSISTANT --conversation PXCONV-503025'];
  static override args = {
    assistantId: Args.string({ required: true, description: 'Assistant rule ID' }),
  };
  static override flags = {
    conversation: Flags.string({ required: true, description: 'Conversation ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AssistantsGetConversation);
    const baseFlags = flags as unknown as BaseFlags;
    const encAssistant = encodeURIComponent(args.assistantId);
    const encConv = encodeURIComponent(flags.conversation);
    await this.runGet(baseFlags, `/assistants/${encAssistant}/conversations/${encConv}`);
  }
}
