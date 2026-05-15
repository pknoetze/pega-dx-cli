import { Args, Flags } from '@oclif/core';
import fsPromises from 'node:fs/promises';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig } from '../../lib/config.js';

export const __endpoint = {
  path: '/attachments/{attachmentID}',
  method: 'GET',
} as const;

export default class AttachmentsGet extends BaseCommand {
  static override description = 'Get a Pega attachment by ID';
  static override examples = [
    '<%= config.bin %> attachments get ATTACH-1',
    '<%= config.bin %> attachments get ATTACH-1 --output ./file.pdf',
  ];
  static override args = {
    id: Args.string({ required: true, description: 'Attachment ID' }),
  };
  static override flags = {
    output: Flags.string({
      description: 'Write attachment content to this file path',
      char: 'o',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AttachmentsGet);
    const baseFlags = flags as unknown as BaseFlags;
    const path = `/attachments/${encodeURIComponent(args.id)}`;

    if (!flags.output) {
      // Raw JSON mode — delegate to runGet
      await this.runGet(baseFlags, path);
      return;
    }

    // --output mode: fetch, decode/write to disk
    const cfg = getConfig(baseFlags.profile);
    const url = `${cfg.baseUrl}/prweb/api/application/v2${path}`;

    if (baseFlags['dry-run']) {
      this.emitDryRun({
        method: 'GET',
        url,
        headers: { Authorization: 'Bearer <token>', 'x-origin-channel': 'Web' },
      });
      return;
    }

    try {
      const client = await this.getClient(baseFlags);
      const result = await client.get(path) as Record<string, unknown>;
      const outputPath = flags.output;
      // Pega DX API returns content in `message` (Base64) for file attachments,
      // `url` for URL attachments, and `content` (HTML) for Correspondence.
      // There is no `type` discriminator in the GET response itself.
      if (typeof result['message'] === 'string') {
        const bytes = Buffer.from(result['message'] as string, 'base64');
        await fsPromises.writeFile(outputPath, bytes);
        this.emit({ path: outputPath, bytes: bytes.length, type: 'File' }, baseFlags);
      } else if (typeof result['url'] === 'string') {
        await fsPromises.writeFile(outputPath, result['url'] as string, 'utf8');
        this.emit({ path: outputPath, type: 'URL' }, baseFlags);
      } else if (typeof result['content'] === 'string') {
        await fsPromises.writeFile(outputPath, result['content'] as string, 'utf8');
        this.emit({ path: outputPath, type: 'Correspondence' }, baseFlags);
      } else {
        const fallback = JSON.stringify(result);
        await fsPromises.writeFile(outputPath, fallback, 'utf8');
        this.emit({ path: outputPath, type: 'unknown' }, baseFlags);
      }
    } catch (err) {
      this.fail(err);
    }
  }
}
