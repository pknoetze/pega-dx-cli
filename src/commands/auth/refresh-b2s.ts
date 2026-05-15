import { Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/refreshB2S',
  method: 'POST',
} as const;

export default class AuthRefreshB2S extends BaseCommand {
  static override description = 'Refresh a B2S authentication token';
  static override examples = [
    '<%= config.bin %> auth refresh-b2s --token OLD_TOKEN',
  ];
  static override flags = {
    token: Flags.string({ required: true, description: 'Existing B2S token to refresh' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthRefreshB2S);
    await this.runPost(
      flags as unknown as BaseFlags,
      '/refreshB2S',
      { B2SToken: flags.token },
    );
  }
}
