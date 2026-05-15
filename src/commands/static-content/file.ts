import { Args, Flags } from '@oclif/core';
import fsPromises from 'node:fs/promises';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig } from '../../lib/config.js';

export const __endpoint = {
  path: '/files/{fileID}',
  method: 'GET',
} as const;

export default class StaticContentFile extends BaseCommand {
  static override description = 'Get a static file (binary). --output is required.';
  static override examples = [
    '<%= config.bin %> static-content file MyFile --output ./my-file.bin',
  ];
  static override args = {
    fileID: Args.string({ required: true, description: 'File ID' }),
  };
  static override flags = {
    output: Flags.string({
      char: 'o',
      required: true,
      description: 'Required: write binary bytes to this file path',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(StaticContentFile);
    const baseFlags = flags as unknown as BaseFlags;
    const path = `/files/${encodeURIComponent(args.fileID)}`;

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
      const raw = await client.getRaw(path);
      await fsPromises.writeFile(flags.output, raw.data);
      this.emit(
        { path: flags.output, bytes: raw.data.length, contentType: raw.contentType },
        baseFlags,
      );
    } catch (err) {
      this.fail(err);
    }
  }
}
