import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/cases/{caseID}/attachments',
  method: 'GET',
} as const;

export default class AttachmentsList extends BaseCommand {
  static override description = 'List attachments on a Pega case';
  static override examples = [
    '<%= config.bin %> attachments list MYAPP-CASE-1',
    '<%= config.bin %> attachments list MYAPP-CASE-1 --include-thumbnails',
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Full case handle' }),
  };
  static override flags = {
    'include-thumbnails': Flags.boolean({
      description: 'Include thumbnail images in the response',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AttachmentsList);
    const encCaseId = encodeURIComponent(args.caseId);
    const path = flags['include-thumbnails']
      ? `/cases/${encCaseId}/attachments?includeThumbnails=true`
      : `/cases/${encCaseId}/attachments`;
    await this.runGet(flags as unknown as BaseFlags, path);
  }
}
