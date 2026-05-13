import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class UserSettingsGet extends BaseCommand {
  static override description = 'Get operator user settings';
  static override examples = ['<%= config.bin %> user-settings get'];
  static override flags = {};

  async run(): Promise<void> {
    const { flags } = await this.parse(UserSettingsGet);
    await this.runGet(flags as unknown as BaseFlags, '/user_settings');
  }
}
