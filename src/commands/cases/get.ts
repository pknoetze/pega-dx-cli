import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig } from '../../lib/config.js';

export const __endpoint = {
  path: '/cases/{caseID}',
  method: 'GET',
} as const;

export default class CasesGet extends BaseCommand {
  static override description = 'Get a Pega case by ID';
  static override examples = ['<%= config.bin %> cases get MYAPP-CASE-1 --fields status,urgency'];
  static override args = {
    caseId: Args.string({ required: true, description: 'Full case handle' }),
  };
  static override flags = {};

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CasesGet);
    const baseFlags = flags as unknown as BaseFlags;
    const cfg = getConfig(baseFlags.profile);
    const path = `/cases/${encodeURIComponent(args.caseId)}`;
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
