import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/ui_lists/{ui_list_ID}/personalizations',
  method: 'GET',
} as const;

export default class UiListsListPersonalizations extends BaseCommand {
  static override description = 'List personalizations for a UI list';
  static override examples = ['<%= config.bin %> ui-lists list-personalizations LIST-1'];
  static override args = {
    uiListID: Args.string({ required: true, description: 'UI list ID' }),
  };
  static override flags = {};

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UiListsListPersonalizations);
    await this.runGet(
      flags as unknown as BaseFlags,
      `/ui_lists/${encodeURIComponent(args.uiListID)}/personalizations`,
    );
  }
}
