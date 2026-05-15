import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/ui_lists/{viewName}/move',
  method: 'PATCH',
} as const;

export default class UiListsMove extends BaseCommand {
  static override description = 'Move a record within a UI list';
  static override examples = ['<%= config.bin %> ui-lists move MyListView --source-id R-1 --destination-id R-2'];
  static override args = {
    viewName: Args.string({ required: true, description: 'UI list view name' }),
  };
  static override flags = {
    'source-id': Flags.string({ required: true, description: 'sourceID' }),
    'destination-id': Flags.string({ required: true, description: 'destinationID' }),
    context: Flags.string({ description: 'context (optional)' }),
    'list-class': Flags.string({ description: 'listClass (optional)' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UiListsMove);
    const baseFlags = flags as unknown as BaseFlags;
    const body: Record<string, unknown> = {
      sourceID: flags['source-id'],
      destinationID: flags['destination-id'],
    };
    if (flags.context !== undefined) body.context = flags.context;
    if (flags['list-class'] !== undefined) body.listClass = flags['list-class'];
    await this.runPatch(baseFlags, `/ui_lists/${encodeURIComponent(args.viewName)}/move`, body);
  }
}
