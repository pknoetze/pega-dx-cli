import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class AssistantsCloseConversation extends BaseCommand {
  static override description = 'Close a GenAI assistant conversation';
  static override examples = ['<%= config.bin %> assistants close-conversation MYASSISTANT --conversation PXCONV-1'];
  static override args = {
    assistantId: Args.string({ required: true, description: 'Assistant rule ID' }),
  };
  static override flags = {
    conversation: Flags.string({ required: true, description: 'Conversation ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AssistantsCloseConversation);
    const baseFlags = flags as unknown as BaseFlags;
    const encAssistant = encodeURIComponent(args.assistantId);
    const encConv = encodeURIComponent(flags.conversation);
    await this.runPut(baseFlags, `/assistants/${encAssistant}/conversations/${encConv}/close`, undefined);
  }
}
