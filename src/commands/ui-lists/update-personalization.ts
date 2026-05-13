import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class UiListsUpdatePersonalization extends BaseCommand {
  static override description = 'Update a personalization on a UI list';
  static override examples = ['<%= config.bin %> ui-lists update-personalization LIST-1 PERS-1 --name "Edited"'];
  static override args = {
    uiListID: Args.string({ required: true, description: 'UI list ID' }),
    personalizationID: Args.string({ required: true, description: 'Personalization ID' }),
  };
  static override flags = {
    name: Flags.string({ required: true, description: 'Personalization name' }),
    id: Flags.string({ description: 'ID' }),
    'personalization-state': Flags.string({ description: 'personalizationState (verbatim string)' }),
    'mark-as-default': Flags.boolean({ allowNo: true, description: 'markAsDefault' }),
    'mark-as-app-default': Flags.boolean({ allowNo: true, description: 'markAsAppDefault' }),
    'route-to-workbasket': Flags.string({ description: 'pyRouteToWorkbasket' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UiListsUpdatePersonalization);
    const baseFlags = flags as unknown as BaseFlags;
    const body: Record<string, unknown> = { name: flags.name };
    if (flags.id !== undefined) body.ID = flags.id;
    if (flags['personalization-state'] !== undefined) body.personalizationState = flags['personalization-state'];
    if (flags['mark-as-default'] !== undefined) body.markAsDefault = flags['mark-as-default'];
    if (flags['mark-as-app-default'] !== undefined) body.markAsAppDefault = flags['mark-as-app-default'];
    if (flags['route-to-workbasket'] !== undefined) body.pyRouteToWorkbasket = flags['route-to-workbasket'];
    await this.runPut(
      baseFlags,
      `/ui_lists/${encodeURIComponent(args.uiListID)}/personalizations/${encodeURIComponent(args.personalizationID)}`,
      body,
    );
  }
}
