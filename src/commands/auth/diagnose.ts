import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig, getToken } from '../../lib/config.js';
import { createPegaApiClient } from '../../lib/api-client.js';
import { isNormalizedError } from '../../lib/errors.js';

interface Check {
  name: 'baseUrl' | 'credentials' | 'oauth' | 'apiV2';
  status: 'pass' | 'fail';
  detail: string;
}

export default class AuthDiagnose extends BaseCommand {
  static override description = 'Run diagnostic checks against Pega configuration';
  static override examples = ['<%= config.bin %> auth diagnose'];
  static override flags = {};

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthDiagnose);
    const baseFlags = flags as unknown as BaseFlags;

    if (baseFlags['dry-run']) {
      // Diagnose's first network action is the OAuth exchange; show that.
      let baseUrl = '<unresolved>';
      let clientId = '';
      let clientSecret = '';
      try {
        const cfg = getConfig(baseFlags.profile);
        baseUrl = cfg.baseUrl;
        clientId = cfg.clientId;
        clientSecret = cfg.clientSecret;
      } catch {
        /* config incomplete — still show what we'd try */
      }
      const basic = clientId && clientSecret
        ? Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
        : '<missing-credentials>';
      this.emitDryRun({
        method: 'POST',
        url: `${baseUrl}/prweb/PRRestService/oauth2/v1/token`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basic}`,
        },
        body: 'grant_type=client_credentials',
      });
      return;
    }

    const checks: Check[] = [];

    let cfg: ReturnType<typeof getConfig> | null = null;
    try {
      cfg = getConfig(baseFlags.profile);
      checks.push({ name: 'baseUrl', status: 'pass', detail: cfg.baseUrl });
    } catch (err) {
      const msg = isNormalizedError(err) ? err.message : (err as Error).message;
      checks.push({ name: 'baseUrl', status: 'fail', detail: msg });
      checks.push({ name: 'credentials', status: 'fail', detail: 'skipped (baseUrl missing)' });
      checks.push({ name: 'oauth', status: 'fail', detail: 'skipped (baseUrl missing)' });
      checks.push({ name: 'apiV2', status: 'fail', detail: 'skipped (baseUrl missing)' });
      this.emit({ checks, overall: 'fail' }, baseFlags);
      return;
    }

    checks.push({
      name: 'credentials',
      status: 'pass',
      detail: 'clientId and clientSecret present',
    });

    let accessToken: string | null = null;
    try {
      const tk = await getToken({ noCache: baseFlags['no-cache'], profile: baseFlags.profile });
      accessToken = tk.accessToken;
      checks.push({ name: 'oauth', status: 'pass', detail: 'Token acquired successfully' });
    } catch (err) {
      const msg = isNormalizedError(err) ? err.message : (err as Error).message;
      checks.push({ name: 'oauth', status: 'fail', detail: msg });
      checks.push({ name: 'apiV2', status: 'fail', detail: 'skipped (oauth failed)' });
      this.emit({ checks, overall: 'fail' }, baseFlags);
      return;
    }

    try {
      const client = createPegaApiClient({
        baseUrl: cfg.baseUrl,
        tokenProvider: async () => accessToken!,
      });
      await client.get('/casetypes');
      checks.push({ name: 'apiV2', status: 'pass', detail: 'Constellation DX API reachable' });
    } catch (err) {
      const msg = isNormalizedError(err) ? err.message : (err as Error).message;
      checks.push({ name: 'apiV2', status: 'fail', detail: msg });
    }

    const overall = checks.every((c) => c.status === 'pass') ? 'pass' : 'fail';
    this.emit({ checks, overall }, baseFlags);
  }
}
