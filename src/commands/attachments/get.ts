import { Args, Flags } from '@oclif/core';
import fsPromises from 'node:fs/promises';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig } from '../../lib/config.js';

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
      const type = result['type'] as string | undefined;

      if (type === 'File') {
        const content = result['content'] as string;
        const bytes = Buffer.from(content, 'base64');
        await fsPromises.writeFile(outputPath, bytes);
        this.emit({ path: outputPath, bytes: bytes.length, type: 'File' }, baseFlags);
      } else if (type === 'URL') {
        const urlContent = result['url'] as string ?? result['content'] as string;
        await fsPromises.writeFile(outputPath, urlContent, 'utf8');
        this.emit({ path: outputPath, type: 'URL' }, baseFlags);
      } else if (type === 'Correspondence') {
        const htmlContent = result['content'] as string;
        await fsPromises.writeFile(outputPath, htmlContent, 'utf8');
        this.emit({ path: outputPath, type: 'Correspondence' }, baseFlags);
      } else {
        const fallback = JSON.stringify(result);
        await fsPromises.writeFile(outputPath, fallback, 'utf8');
        this.emit({ path: outputPath, type: type ?? 'unknown' }, baseFlags);
      }
    } catch (err) {
      this.fail(err);
    }
  }
}
