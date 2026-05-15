import { Args, Flags } from '@oclif/core';
import fsPromises from 'node:fs/promises';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig } from '../../lib/config.js';

export const __endpoint = {
  path: '/users/{user_ID}/profile-image',
  method: 'GET',
} as const;

export default class StaticContentProfileImage extends BaseCommand {
  static override description = 'Get a user profile image';
  static override examples = [
    '<%= config.bin %> static-content profile-image user123',
    '<%= config.bin %> static-content profile-image user123 --output ./profile.jpg',
  ];
  static override args = {
    userId: Args.string({ required: true, description: 'User ID' }),
  };
  static override flags = {
    output: Flags.string({
      char: 'o',
      description: 'Write image to this file path (default: stdout)',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(StaticContentProfileImage);
    const baseFlags = flags as unknown as BaseFlags;
    const path = `/users/${encodeURIComponent(args.userId)}/profile-image`;

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
      if (flags.output) {
        await fsPromises.writeFile(flags.output, raw.data);
        this.emit(
          { path: flags.output, bytes: raw.data.length, contentType: raw.contentType },
          baseFlags,
        );
      } else {
        process.stdout.write(raw.data);
      }
    } catch (err) {
      this.fail(err);
    }
  }
}
