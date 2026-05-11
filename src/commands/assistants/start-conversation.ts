import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class AssistantsStartConversation extends BaseCommand {
  static override description = 'Start a new GenAI assistant conversation';
  static override examples = [
    '<%= config.bin %> assistants start-conversation MYASSISTANT --context-id MYORG-WORK\\!M-123',
    '<%= config.bin %> assistants start-conversation MYASSISTANT --no-execute-starter',
  ];
  static override args = {
    assistantId: Args.string({ required: true, description: 'Assistant rule ID (pxInsName)' }),
  };
  static override flags = {
    'context-id': Flags.string({ description: 'Context ID (case or landing-page context)' }),
    'interaction-id': Flags.string({ description: 'Unique ID for external-app interactions' }),
    'execute-starter': Flags.boolean({
      allowNo: true,
      description: 'Whether to execute the configured starter question on initiation',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AssistantsStartConversation);
    const baseFlags = flags as unknown as BaseFlags;
    const encAssistant = encodeURIComponent(args.assistantId);
    const body: Record<string, unknown> = {};
    if (flags['context-id'] !== undefined) body.contextID = flags['context-id'];
    if (flags['interaction-id'] !== undefined) body.interactionID = flags['interaction-id'];
    if (flags['execute-starter'] !== undefined) body.executeStarterQuestion = flags['execute-starter'];
    await this.runPost(baseFlags, `/assistants/${encAssistant}/conversations`, body);
  }
}
