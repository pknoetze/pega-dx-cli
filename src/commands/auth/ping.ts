import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig } from '../../lib/config.js';
import { isNormalizedError } from '../../lib/errors.js';

export default class AuthPing extends BaseCommand {
  static override description = 'Check Pega API V2 reachability';
  static override examples = ['<%= config.bin %> auth ping'];
  static override flags = {};

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthPing);
    const baseFlags = flags as unknown as BaseFlags;

    if (baseFlags['dry-run']) {
      const cfg = getConfig(baseFlags.profile);
      this.emitDryRun({
        method: 'GET',
        url: `${cfg.baseUrl}/prweb/api/application/v2/casetypes`,
        headers: { Authorization: 'Bearer <token>', 'x-origin-channel': 'Web' },
      });
      return;
    }

    const start = performance.now();
    try {
      const client = await this.getClient(baseFlags);
      await client.get('/casetypes');
      const responseTimeMs = Math.round(performance.now() - start);
      this.emit({ reachable: true, responseTimeMs }, baseFlags);
    } catch (err) {
      const message = isNormalizedError(err) ? err.message : (err as Error).message;
      this.emit({ reachable: false, error: message }, baseFlags);
    }
  }
}
