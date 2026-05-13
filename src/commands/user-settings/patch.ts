import { Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { parseDataInput } from '../../lib/input.js';

export default class UserSettingsPatch extends BaseCommand {
  static override description = 'Patch operator user settings';
  static override examples = [
    "<%= config.bin %> user-settings patch --data '{\"patchPreference\":\"someValue\"}'",
    '<%= config.bin %> user-settings patch --data @settings.json',
    '<%= config.bin %> user-settings patch --data -',
  ];
  static override flags = {
    data: Flags.string({ required: true, description: 'JSON body (inline, @file, or -)' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(UserSettingsPatch);
    const baseFlags = flags as unknown as BaseFlags;
    try {
      const body = await parseDataInput(flags.data, '--data');
      await this.runPatch(baseFlags, '/user_settings', body);
    } catch (err) {
      this.fail(err);
    }
  }
}
