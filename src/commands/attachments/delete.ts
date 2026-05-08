import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class AttachmentsDelete extends BaseCommand {
  static override description = 'Delete a Pega attachment by ID';
  static override examples = ['<%= config.bin %> attachments delete ATTACH-ID-1'];
  static override args = {
    id: Args.string({ required: true, description: 'Attachment ID' }),
  };
  static override flags = {};

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AttachmentsDelete);
    const baseFlags = flags as unknown as BaseFlags;
    await this.runDelete(baseFlags, `/attachments/${encodeURIComponent(args.id)}`);
  }
}
