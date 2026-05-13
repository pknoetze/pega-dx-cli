import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class SocialUpdateMessage extends BaseCommand {
  static override description = 'Edit a Pulse message';
  static override examples = ['<%= config.bin %> social update-message MSG-1 --message "edited"'];
  static override args = { messageID: Args.string({ required: true, description: 'Message ID' }) };
  static override flags = {
    message: Flags.string({ required: true, description: 'New message text' }),
    'route-to-workbasket': Flags.string({ description: 'pyRouteToWorkbasket' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(SocialUpdateMessage);
    const baseFlags = flags as unknown as BaseFlags;
    const body: Record<string, unknown> = { message: flags.message };
    if (flags['route-to-workbasket'] !== undefined) body.pyRouteToWorkbasket = flags['route-to-workbasket'];
    await this.runPut(baseFlags, `/messages/${encodeURIComponent(args.messageID)}`, body);
  }
}
