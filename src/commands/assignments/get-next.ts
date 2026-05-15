import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig } from '../../lib/config.js';
import { isNormalizedError } from '../../lib/errors.js';

export const __endpoint = {
  path: '/assignments/next',
  method: 'GET',
} as const;

export default class AssignmentsGetNext extends BaseCommand {
  static override description = 'Get the next assignment from the worklist';
  static override examples = ['<%= config.bin %> assignments get-next'];
  static override flags = {};

  async run(): Promise<void> {
    const { flags } = await this.parse(AssignmentsGetNext);
    const baseFlags = flags as unknown as BaseFlags;
    const cfg = getConfig(baseFlags.profile);
    const url = `${cfg.baseUrl}/prweb/api/application/v2/assignments/next`;

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
      const result = await client.get('/assignments/next');
      this.emit(result, baseFlags);
    } catch (err) {
      if (isNormalizedError(err) && err.code === 'NOT_FOUND') {
        this.emit({ assignment: null }, baseFlags);
        return;
      }
      this.fail(err);
    }
  }
}
