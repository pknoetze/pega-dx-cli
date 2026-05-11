import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { parseDataInput } from '../../lib/input.js';

export default class AiAgentsSendMessage extends BaseCommand {
  static override description = 'Send a message in an AI agent conversation';
  static override examples = [
    '<%= config.bin %> ai-agents send-message MYAGENT --conversation PXCONV-1 --request "hello"',
    '<%= config.bin %> ai-agents send-message MYAGENT --conversation PXCONV-1 --request "with file" --attachments @attachments.json',
  ];
  static override args = {
    agentId: Args.string({ required: true, description: 'Agent rule ID (pxInsName)' }),
  };
  static override flags = {
    conversation: Flags.string({ required: true, description: 'Conversation ID' }),
    request: Flags.string({ required: true, description: 'User query text' }),
    attachments: Flags.string({
      description: 'JSON array of attachment descriptors (inline JSON, @file, or - for stdin)',
    }),
    'active-channel': Flags.string({ description: 'Channel type (Web, Email, Chat, ...)' }),
    'active-channel-id': Flags.string({ description: 'Unique ID of the channel' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AiAgentsSendMessage);
    const baseFlags = flags as unknown as BaseFlags;
    const encAgent = encodeURIComponent(args.agentId);
    const encConv = encodeURIComponent(flags.conversation);
    try {
      const body: Record<string, unknown> = { Request: flags.request };
      if (flags.attachments !== undefined) {
        body.Attachments = await parseDataInput(flags.attachments, '--attachments');
      }
      if (flags['active-channel'] !== undefined) body.activeChannel = flags['active-channel'];
      if (flags['active-channel-id'] !== undefined) body.activeChannelID = flags['active-channel-id'];
      await this.runPatch(baseFlags, `/ai-agents/${encAgent}/conversations/${encConv}`, body);
    } catch (err) {
      this.fail(err);
    }
  }
}
