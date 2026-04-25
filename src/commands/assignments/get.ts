import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig } from '../../lib/config.js';

export default class AssignmentsGet extends BaseCommand {
  static override description = 'Get a Pega assignment by ID';
  static override examples = ['<%= config.bin %> assignments get ASSIGN-WORKLIST X-1!FLOW'];
  static override args = {
    assignmentId: Args.string({ required: true, description: 'Full assignment handle' }),
  };
  static override flags = {};

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AssignmentsGet);
    const baseFlags = flags as unknown as BaseFlags;
    const cfg = getConfig(baseFlags.profile);
    const path = `/assignments/${encodeURIComponent(args.assignmentId)}`;
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
      const result = await client.get(path);
      this.emit(result, baseFlags);
    } catch (err) {
      this.fail(err);
    }
  }
}
