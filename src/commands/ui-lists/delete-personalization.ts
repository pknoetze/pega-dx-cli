import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/ui_lists/{ui_list_ID}/personalizations/{personalizationID}',
  method: 'DELETE',
} as const;

export default class UiListsDeletePersonalization extends BaseCommand {
  static override description = 'Delete a personalization on a UI list';
  static override examples = ['<%= config.bin %> ui-lists delete-personalization LIST-1 PERS-1'];
  static override args = {
    uiListID: Args.string({ required: true, description: 'UI list ID' }),
    personalizationID: Args.string({ required: true, description: 'Personalization ID' }),
  };
  static override flags = {};

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UiListsDeletePersonalization);
    await this.runDelete(
      flags as unknown as BaseFlags,
      `/ui_lists/${encodeURIComponent(args.uiListID)}/personalizations/${encodeURIComponent(args.personalizationID)}`,
    );
  }
}
