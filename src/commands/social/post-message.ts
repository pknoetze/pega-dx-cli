import { Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class SocialPostMessage extends BaseCommand {
  static override description = 'Post a new Pulse message';
  static override examples = ['<%= config.bin %> social post-message --context MYORG-WORK\\!M-1 --message "hello"'];
  static override flags = {
    context: Flags.string({ required: true, description: 'Pulse context ID' }),
    message: Flags.string({ required: true, description: 'Message text' }),
    'route-to-workbasket': Flags.string({ description: 'pyRouteToWorkbasket value' }),
    'message-type': Flags.string({ description: '→ ?message-type= (query string, not body)' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SocialPostMessage);
    const baseFlags = flags as unknown as BaseFlags;
    const body: Record<string, unknown> = {
      context: flags.context,
      message: flags.message,
    };
    if (flags['route-to-workbasket'] !== undefined) body.pyRouteToWorkbasket = flags['route-to-workbasket'];
    let path = '/messages';
    if (flags['message-type'] !== undefined) {
      const params = new URLSearchParams({ 'message-type': flags['message-type'] });
      path = `${path}?${params.toString()}`;
    }
    await this.runPost(baseFlags, path, body);
  }
}
