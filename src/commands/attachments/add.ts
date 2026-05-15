import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { parseDataInput } from '../../lib/input.js';

export const __endpoint = {
  path: '/cases/{caseID}/attachments',
  method: 'POST',
} as const;

export default class AttachmentsAdd extends BaseCommand {
  static override description = 'Add attachments to a Pega case (atomic batch POST)';
  static override examples = [
    '<%= config.bin %> attachments add MYAPP-CASE-1 --attachments \'[{"type":"File","category":"Correspondence","name":"doc.pdf","ID":"att-id-123"}]\'',
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Full case handle' }),
  };
  static override flags = {
    attachments: Flags.string({
      required: true,
      description: 'JSON array of attachment objects (inline, @file, or -)',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AttachmentsAdd);
    const baseFlags = flags as unknown as BaseFlags;
    const encCaseId = encodeURIComponent(args.caseId);
    try {
      const parsed = await parseDataInput(flags.attachments, '--attachments');
      await this.runPost(baseFlags, `/cases/${encCaseId}/attachments`, { attachments: parsed });
    } catch (err) {
      this.fail(err);
    }
  }
}
