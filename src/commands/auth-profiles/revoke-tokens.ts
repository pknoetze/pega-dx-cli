import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/authentication-profiles/{authProfileName}/user-tokens',
  method: 'DELETE',
} as const;

export default class AuthProfilesRevokeTokens extends BaseCommand {
  static override description = 'Revoke user-specific tokens for an authentication profile';
  static override examples = [
    '<%= config.bin %> auth-profiles revoke-tokens MyProfile',
    '<%= config.bin %> auth-profiles revoke-tokens MyProfile --gadget-id gadget123',
  ];
  static override args = {
    authProfileName: Args.string({ required: true, description: 'Authentication profile name' }),
  };
  static override flags = {
    'gadget-id': Flags.string({ description: 'Gadget ID (→ ?gadgetId=)' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AuthProfilesRevokeTokens);
    const baseFlags = flags as unknown as BaseFlags;
    let path = `/authentication-profiles/${encodeURIComponent(args.authProfileName)}/user-tokens`;
    if (flags['gadget-id'] !== undefined) {
      const params = new URLSearchParams({ gadgetId: flags['gadget-id'] });
      path = `${path}?${params.toString()}`;
    }
    await this.runDelete(baseFlags, path);
  }
}
