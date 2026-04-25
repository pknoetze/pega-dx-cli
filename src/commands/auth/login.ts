import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { clearToken, getConfig, getToken } from '../../lib/config.js';

export default class AuthLogin extends BaseCommand {
  static override description = 'Acquire a fresh OAuth token and cache it';
  static override examples = ['<%= config.bin %> auth login'];
  static override flags = {};

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthLogin);
    const baseFlags = flags as unknown as BaseFlags;
    const cfg = getConfig(baseFlags.profile);

    if (baseFlags['dry-run']) {
      const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64');
      this.emitDryRun({
        method: 'POST',
        url: `${cfg.baseUrl}/prweb/PRRestService/oauth2/v1/token`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basic}`,
        },
        body: 'grant_type=client_credentials',
      });
      return;
    }

    try {
      clearToken(baseFlags.profile);
      const token = await getToken({
        noCache: baseFlags['no-cache'],
        profile: baseFlags.profile,
        forceFresh: true,
      });
      this.emit({ authenticated: true, expiresAt: token.expiresAt }, baseFlags);
    } catch (err) {
      this.fail(err);
    }
  }
}
