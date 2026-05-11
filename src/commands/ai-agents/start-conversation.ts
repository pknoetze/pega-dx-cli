import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class AiAgentsStartConversation extends BaseCommand {
  static override description = 'Start a new AI agent conversation';
  static override examples = [
    '<%= config.bin %> ai-agents start-conversation MYAGENT --context-id MYORG-WORK\\!M-123',
    '<%= config.bin %> ai-agents start-conversation MYAGENT --no-execute-starter',
  ];
  static override args = {
    agentId: Args.string({ required: true, description: 'Agent rule ID (pxInsName)' }),
  };
  static override flags = {
    'context-id': Flags.string({ description: 'Context ID (case or landing-page context)' }),
    'interaction-id': Flags.string({ description: 'Unique ID for external-app interactions' }),
    'execute-starter': Flags.boolean({
      allowNo: true,
      description: 'Whether to execute the configured starter question on initiation',
    }),
    'active-channel': Flags.string({ description: 'Channel type (Web, Email, Chat, ...)' }),
    'active-channel-id': Flags.string({ description: 'Unique ID of the channel' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AiAgentsStartConversation);
    const baseFlags = flags as unknown as BaseFlags;
    const encAgent = encodeURIComponent(args.agentId);
    const body: Record<string, unknown> = {};
    if (flags['context-id'] !== undefined) body.contextID = flags['context-id'];
    if (flags['interaction-id'] !== undefined) body.interactionID = flags['interaction-id'];
    if (flags['execute-starter'] !== undefined) body.executeStarterQuestion = flags['execute-starter'];
    if (flags['active-channel'] !== undefined) body.activeChannel = flags['active-channel'];
    if (flags['active-channel-id'] !== undefined) body.activeChannelID = flags['active-channel-id'];
    await this.runPost(baseFlags, `/ai-agents/${encAgent}/conversations`, body);
  }
}
