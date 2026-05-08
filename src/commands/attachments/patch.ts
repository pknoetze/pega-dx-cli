import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import type { NormalizedError } from '../../lib/errors.js';

export default class AttachmentsPatch extends BaseCommand {
  static override description = 'Update attachment metadata (name and/or category)';
  static override examples = [
    '<%= config.bin %> attachments patch ATTACH-ID-1 --name "New Name"',
    '<%= config.bin %> attachments patch ATTACH-ID-1 --category Correspondence',
    '<%= config.bin %> attachments patch ATTACH-ID-1 --name "New Name" --category Correspondence',
  ];
  static override args = {
    id: Args.string({ required: true, description: 'Attachment ID' }),
  };
  static override flags = {
    name: Flags.string({ description: 'New attachment name' }),
    category: Flags.string({ description: 'New attachment category' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AttachmentsPatch);
    const baseFlags = flags as unknown as BaseFlags;
    if (!flags.name && !flags.category) {
      throw { code: 'INVALID_ARGS', message: 'At least one of --name or --category is required', httpStatus: 0 } satisfies NormalizedError;
    }
    const body: Record<string, unknown> = {};
    if (flags.name) body.name = flags.name;
    if (flags.category) body.category = flags.category;
    await this.runPatch(baseFlags, `/attachments/${encodeURIComponent(args.id)}`, body);
  }
}
