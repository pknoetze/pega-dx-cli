import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig } from '../../lib/config.js';

export const __endpoint = {
  path: '/cases/{caseID}',
  method: 'DELETE',
} as const;

export default class CasesDelete extends BaseCommand {
  static override description = 'Delete a Pega case (V2)';
  static override examples = ['<%= config.bin %> cases delete MYAPP-CASE-1'];
  static override args = {
    caseId: Args.string({ required: true, description: 'Full case handle' }),
  };
  static override flags = {};

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CasesDelete);
    const baseFlags = flags as unknown as BaseFlags;
    const cfg = getConfig(baseFlags.profile);
    const path = `/cases/${encodeURIComponent(args.caseId)}`;
    const url = `${cfg.baseUrl}/prweb/api/application/v2${path}`;

    if (baseFlags['dry-run']) {
      this.emitDryRun({
        method: 'DELETE',
        url,
        headers: { Authorization: 'Bearer <token>', 'x-origin-channel': 'Web' },
      });
      return;
    }

    try {
      const client = await this.getClient(baseFlags);
      await client.delete(path);
      this.emit({ deleted: true, caseId: args.caseId }, baseFlags);
    } catch (err) {
      this.fail(err);
    }
  }
}
