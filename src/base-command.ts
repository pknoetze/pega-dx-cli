import { Command, Flags, type Interfaces } from '@oclif/core';
import { createPegaApiClient, type PegaApiClient } from './lib/api-client.js';
import { getConfig, getToken } from './lib/config.js';
import { stdout, stderr, error, dryRun, type DryRunRequest } from './lib/output.js';
import { isNormalizedError, exitCodeFor, type NormalizedError } from './lib/errors.js';

export type BaseFlags = Interfaces.InferredFlags<typeof BaseCommand.baseFlags>;

function dryRunHeadersFor(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  opts: { hasBody?: boolean; requiresEtag?: boolean } = {},
): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: 'Bearer <token>',
    'x-origin-channel': 'Web',
  };
  if (opts.hasBody) headers['Content-Type'] = 'application/json';
  if (opts.requiresEtag) headers['If-Match'] = '<etag-from-GET>';
  return headers;
}

export abstract class BaseCommand extends Command {
  static override baseFlags = {
    format: Flags.string({
      description: 'Output format (json, compact, yaml, table)',
      options: ['json', 'compact', 'yaml', 'table'],
      default: 'json',
    }),
    fields: Flags.string({
      description: 'Comma-separated top-level fields to include in output',
    }),
    'dry-run': Flags.boolean({
      description: 'Print HTTP request details and exit without executing',
      default: false,
    }),
    quiet: Flags.boolean({
      description: 'Suppress all stderr progress/warning output',
      default: false,
    }),
    verbose: Flags.boolean({
      description: 'Emit full HTTP request/response details to stderr',
      default: false,
    }),
    'no-cache': Flags.boolean({
      description: 'Bypass token file cache; perform fresh OAuth exchange',
      default: false,
    }),
    profile: Flags.string({
      description: 'Named config profile',
      default: 'default',
    }),
  };

  protected async getClient(flags: BaseFlags): Promise<PegaApiClient> {
    const cfg = getConfig(flags.profile);
    const noCache = flags['no-cache'];
    return createPegaApiClient({
      baseUrl: cfg.baseUrl,
      tokenProvider: async () => {
        const token = await getToken({ noCache, profile: flags.profile });
        return token.accessToken;
      },
      onVerbose: flags.verbose
        ? (req, res) => {
            stderr(`→ ${req.method} ${req.url}`, { quiet: flags.quiet });
            stderr(`← ${res.status}`, { quiet: flags.quiet });
          }
        : undefined,
    });
  }

  protected emit(data: unknown, flags: BaseFlags): void {
    stdout(data, {
      format: flags.format as 'json' | 'compact' | 'yaml' | 'table',
      fields: flags.fields,
      quiet: flags.quiet,
    });
  }

  protected emitDryRun(req: DryRunRequest): void {
    dryRun(req);
  }

  protected async runGet(flags: BaseFlags, path: string): Promise<void> {
    const cfg = getConfig(flags.profile);
    const url = `${cfg.baseUrl}/prweb/api/application/v2${path}`;
    if (flags['dry-run']) {
      this.emitDryRun({ method: 'GET', url, headers: dryRunHeadersFor('GET') });
      return;
    }
    try {
      const client = await this.getClient(flags);
      const result = await client.get(path);
      this.emit(result, flags);
    } catch (err) {
      this.fail(err);
    }
  }

  protected async runDelete(flags: BaseFlags, path: string): Promise<void> {
    const cfg = getConfig(flags.profile);
    const url = `${cfg.baseUrl}/prweb/api/application/v2${path}`;
    if (flags['dry-run']) {
      this.emitDryRun({ method: 'DELETE', url, headers: dryRunHeadersFor('DELETE') });
      return;
    }
    try {
      const client = await this.getClient(flags);
      const result = await client.delete(path);
      this.emit(result, flags);
    } catch (err) {
      this.fail(err);
    }
  }

  protected async runPost(flags: BaseFlags, path: string, body: unknown): Promise<void> {
    const cfg = getConfig(flags.profile);
    const url = `${cfg.baseUrl}/prweb/api/application/v2${path}`;
    if (flags['dry-run']) {
      this.emitDryRun({
        method: 'POST',
        url,
        headers: dryRunHeadersFor('POST', { hasBody: true }),
        body,
      });
      return;
    }
    try {
      const client = await this.getClient(flags);
      const result = await client.post(path, body);
      this.emit(result, flags);
    } catch (err) {
      this.fail(err);
    }
  }

  protected async runMutateWithEtag(
    flags: BaseFlags,
    method: 'POST' | 'PUT' | 'PATCH',
    parentPath: string,
    path: string,
    body: unknown,
  ): Promise<void> {
    const cfg = getConfig(flags.profile);
    const url = `${cfg.baseUrl}/prweb/api/application/v2${path}`;
    if (flags['dry-run']) {
      this.emitDryRun({
        method,
        url,
        headers: dryRunHeadersFor(method, { hasBody: true, requiresEtag: true }),
        body,
      });
      return;
    }
    try {
      const client = await this.getClient(flags);
      const meta = await client.getWithMeta(parentPath);
      const eTag = meta.eTag;
      if (!eTag) {
        throw {
          code: 'MISSING_ETAG',
          message: `Parent resource ${parentPath} did not include an ETag header`,
          httpStatus: meta.status,
        } satisfies NormalizedError;
      }
      let result: unknown;
      if (method === 'PATCH') {
        result = await client.patch(path, body, { extraHeaders: { 'If-Match': eTag } });
      } else if (method === 'PUT') {
        result = await client.put(path, body, { extraHeaders: { 'If-Match': eTag } });
      } else {
        result = await client.post(path, body, { extraHeaders: { 'If-Match': eTag } });
      }
      this.emit(result, flags);
    } catch (err) {
      this.fail(err);
    }
  }

  protected fail(err: unknown): never {
    const normalized: NormalizedError = isNormalizedError(err)
      ? err
      : { code: 'UNKNOWN', message: (err as Error).message || 'Unknown error', httpStatus: 0 };
    error(normalized);
    this.exit(exitCodeFor(normalized));
  }

  override async catch(err: Error & { oclif?: { exit?: number | false } }): Promise<never> {
    // Re-throw oclif-owned exit signals (parse errors, help, version) so
    // oclif's top-level handler formats and exits correctly. Numeric exit codes
    // only — `exit: false` is a non-fatal warning marker.
    if (typeof err.oclif?.exit === 'number') throw err;
    this.fail(err);
  }
}
