import { Args, Flags } from '@oclif/core';
import fsPromises from 'node:fs/promises';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig } from '../../lib/config.js';

export default class StaticContentComponent extends BaseCommand {
  static override description = 'Get a custom component as raw JavaScript';
  static override examples = [
    '<%= config.bin %> static-content component MyComponent',
    '<%= config.bin %> static-content component MyComponent --output ./my-component.js',
  ];
  static override args = {
    componentID: Args.string({ required: true, description: 'Component ID' }),
  };
  static override flags = {
    output: Flags.string({
      char: 'o',
      description: 'Write component JS to this file path (default: stdout)',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(StaticContentComponent);
    const baseFlags = flags as unknown as BaseFlags;
    const path = `/components/${encodeURIComponent(args.componentID)}`;

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
