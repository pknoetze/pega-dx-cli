import { Flags } from '@oclif/core';
import { basename } from 'node:path';
import fsPromises from 'node:fs/promises';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig } from '../../lib/config.js';
import type { NormalizedError } from '../../lib/errors.js';

export const __endpoint = {
  path: '/attachments/upload',
  method: 'POST',
} as const;

export default class AttachmentsUpload extends BaseCommand {
  static override description = 'Upload a file as a Pega attachment (multipart POST)';
  static override examples = [
    '<%= config.bin %> attachments upload --file ./report.pdf',
    '<%= config.bin %> attachments upload --file ./report.pdf --append-unique-id',
  ];

  static override flags = {
    file: Flags.string({
      required: true,
      description: 'Path to the file to upload',
      char: 'f',
    }),
    'append-unique-id': Flags.boolean({
      description: 'Append a unique ID to the uploaded filename',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AttachmentsUpload);
    const baseFlags = flags as unknown as BaseFlags;
    const cfg = getConfig(baseFlags.profile);
    const url = `${cfg.baseUrl}/prweb/api/application/v2/attachments/upload`;
    const fname = basename(flags.file);

    if (baseFlags['dry-run']) {
      this.emitDryRun({
        method: 'POST',
        url,
        headers: {
          Authorization: 'Bearer <token>',
          'x-origin-channel': 'Web',
          'Content-Type': 'multipart/form-data; boundary=<runtime-set>',
        },
        body: {
          file: fname,
          ...(flags['append-unique-id'] ? { appendUniqueIdToFileName: 'true' } : {}),
        },
      });
      return;
    }

    try {
      let fileBuffer: Buffer;
      try {
        fileBuffer = await fsPromises.readFile(flags.file);
      } catch (err) {
        throw {
          code: 'INVALID_ARGS',
          message: `Cannot read file ${flags.file}: ${(err as Error).message}`,
          httpStatus: 0,
        } satisfies NormalizedError;
      }

      const fd = new FormData();
      fd.append('file', new Blob([new Uint8Array(fileBuffer)]), fname);
      if (flags['append-unique-id']) {
        fd.append('appendUniqueIdToFileName', 'true');
      }

      const client = await this.getClient(baseFlags);
      const result = await client.uploadMultipart('/attachments/upload', fd);
      this.emit(result, baseFlags);
    } catch (err) {
      this.fail(err);
    }
  }
}
